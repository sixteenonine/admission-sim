export default {
  async queue(batch, env) {
    const db = env.DB;
    const statements = [];
    // 1. สร้าง Map สำหรับยุบรวมสถิติรายวันไว้ใน Memory
    const dailyStats = new Map();

    // ฟังก์ชันแปลงเวลาเป็นเขตเวลาไทย (UTC+7) และดึงแค่วันที่ (YYYY-MM-DD)
    const getThaiDate = (timestampStr) => {
      const dt = timestampStr ? new Date(timestampStr) : new Date();
      const thaiDt = new Date(dt.getTime() + (7 * 60 * 60 * 1000));
      return thaiDt.toISOString().split('T')[0];
    };

    const latestProgress = new Map(); // 🛡️ In-Memory Deduplication ยุบรวมสถานะซ้ำซ้อน

    for (const message of batch.messages) {
      const { userId, updates } = message.body;

      if (!userId || !Array.isArray(updates)) {
        message.ack();
        continue;
      }

      for (const u of updates) {
        const timestampMs = u.timestamp ? new Date(u.timestamp).getTime() : Date.now();
        const action = u.action || (u.status === 'remembered' ? 'remembered' : 'forgotten');

        
        // 2. หา State ล่าสุดของคำศัพท์แต่ละคำใน Batch
        const progressKey = `${userId}|${u.vocab_id}`;
        if (!latestProgress.has(progressKey) || latestProgress.get(progressKey).timestamp < timestampMs) {
            latestProgress.set(progressKey, { 
                userId, vocab_id: u.vocab_id, action, interval: u.interval, 
                ease_factor: u.ease_factor, next_review_date: u.next_review_date, 
                revision: u.revision, timestamp: timestampMs 
            });
        }
      }
      message.ack();
    }

    // 3. แปลง State ล่าสุดเป็นคำสั่ง UPSERT (ลดจำนวน Operations ลง D1 อย่างมหาศาล)
    for (const data of latestProgress.values()) {
        const actionTimeISO = new Date(data.timestamp).toISOString();
        // 🛡️ Enterprise Fix: นับสถิติ "หลัง" จาก Deduplicate แล้ว (1 คำ = นับแค่ 1 ครั้งต่อ 1 ชุดข้อมูล)
        const studyDate = getThaiDate(data.timestamp);
        const statsKey = `${data.userId}|${studyDate}`;
        if (!dailyStats.has(statsKey)) {
            dailyStats.set(statsKey, { user_id: data.userId, study_date: studyDate, cards: 0, remembered: 0, forgotten: 0 });
        }
        const stat = dailyStats.get(statsKey);
        stat.cards += 1;
        if (data.action === 'remembered') stat.remembered += 1;
        else stat.forgotten += 1;
        statements.push(
            db.prepare(`
                INSERT INTO user_vocab_progress (user_id, vocab_id, status, interval, ease_factor, next_review_date, revision, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (user_id, vocab_id) DO UPDATE SET
                  status = CASE WHEN excluded.last_updated > last_updated THEN excluded.status ELSE status END,
                  interval = CASE WHEN excluded.last_updated > last_updated THEN excluded.interval ELSE interval END,
                  ease_factor = CASE WHEN excluded.last_updated > last_updated THEN excluded.ease_factor ELSE ease_factor END,
                  next_review_date = CASE WHEN excluded.last_updated > last_updated THEN excluded.next_review_date ELSE next_review_date END,
                  revision = CASE WHEN excluded.last_updated > last_updated THEN excluded.revision ELSE revision END,
                  last_updated = CASE WHEN excluded.last_updated > last_updated THEN excluded.last_updated ELSE last_updated END
            `).bind(data.userId, String(data.vocab_id), data.action, data.interval, data.ease_factor, data.next_review_date, data.revision || 0, actionTimeISO)
        );
    }
    // 3. แปลงสถิติรายวันจาก Memory เป็นคำสั่ง UPSERT ส่งเข้าฐานข้อมูลรวดเดียว
    for (const stat of dailyStats.values()) {
      statements.push(
        db.prepare(`
          INSERT INTO user_study_stats (user_id, study_date, cards_reviewed, remembered_count, forgotten_count)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT (user_id, study_date) DO UPDATE SET
            cards_reviewed = cards_reviewed + excluded.cards_reviewed,
            remembered_count = remembered_count + excluded.remembered_count,
            forgotten_count = forgotten_count + excluded.forgotten_count
        `).bind(stat.user_id, stat.study_date, stat.cards, stat.remembered, stat.forgotten)
      );
    }

    if (statements.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < statements.length; i += chunkSize) {
        const chunk = statements.slice(i, i + chunkSize);
        await db.batch(chunk);
      }
    }
  }
};