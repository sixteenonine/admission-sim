export default {
  async queue(batch, env) {
    const db = env.DB;
    const statements = [];

    for (const message of batch.messages) {
      const { userId, updates } = message.body;

      if (!userId || !Array.isArray(updates)) {
        message.ack();
        continue;
      }

      for (const u of updates) {
        const actionTime = u.timestamp ? new Date(u.timestamp).toISOString() : new Date().toISOString();
        
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
          `).bind(
            userId, 
            String(u.vocab_id), 
            u.status, 
            u.interval, 
            u.ease_factor, 
            u.next_review_date, 
            u.revision || 0,
            actionTime
          )
        );
      }
      message.ack();
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