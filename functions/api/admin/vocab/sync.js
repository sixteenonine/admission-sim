export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { sheetUrl, isHardSync } = payload;
    
    if (!sheetUrl) return new Response(JSON.stringify({ status: "error", message: "ไม่มีลิงก์ข้อมูล" }), { status: 400 });

    const db = context.env.DB;

    // 1. Backend โหลดข้อมูลจาก Sheets โดยตรง
    const res = await fetch(sheetUrl);
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('ไม่พบข้อมูลคำศัพท์');

    const headers = lines[0].toLowerCase().split('\t').map(h => h.trim());
    const idx = {
      eng: headers.indexOf('eng'), thai: headers.indexOf('thai'),
      pos: headers.indexOf('pos'), category: headers.indexOf('category'),
      example: headers.indexOf('example'), syn: headers.indexOf('synonyms'), ant: headers.indexOf('antonyms')
    };

    if (idx.eng === -1) throw new Error("ไม่พบคอลัมน์ 'eng'");

    const allWords = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      const eng = cols[idx.eng]?.trim();
      if (!eng) continue;
      allWords.push({
        eng, thai: idx.thai !== -1 ? cols[idx.thai]?.trim() : null,
        pos: idx.pos !== -1 ? cols[idx.pos]?.trim() : null,
        category: idx.category !== -1 ? cols[idx.category]?.trim() : null,
        example: idx.example !== -1 ? cols[idx.example]?.trim() : null,
        synonyms: idx.syn !== -1 ? cols[idx.syn]?.trim() : null,
        antonyms: idx.ant !== -1 ? cols[idx.ant]?.trim() : null,
        sort_order: i
      });
    }

    if (isHardSync) {
        await db.prepare("DELETE FROM vocab_repository").run();
      }

      // --- 2. ดึงข้อมูลเดิมมาเปรียบเทียบ (Optimize Database Write) ---
      const { results: existingRows } = await db.prepare("SELECT eng, thai, pos, category, example, synonyms, antonyms, sort_order, is_deleted FROM vocab_repository").all();
      
      const existingMap = new Map();
      existingRows.forEach(row => existingMap.set(row.eng, row));

      const statements = [];
      const sheetEngs = new Set();
      let insertedCount = 0;
      let updatedCount = 0;

      for (const word of allWords) {
        sheetEngs.add(word.eng);
        const existing = existingMap.get(word.eng);

        // แปลงค่า Null และช่องว่างให้เหมือนกันก่อนเปรียบเทียบ
        const normalize = (val) => val === null || val === undefined ? null : String(val).trim();

        if (!existing) {
          // คำศัพท์ใหม่เอี่ยม -> เก็บคำสั่ง INSERT
          statements.push(db.prepare(`
            INSERT INTO vocab_repository (eng, thai, pos, category, example, synonyms, antonyms, is_deleted, sort_order) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
          `).bind(word.eng, word.thai, word.pos, word.category, word.example, word.synonyms, word.antonyms, word.sort_order));
          insertedCount++;
        } else {
          // มีคำศัพท์อยู่แล้ว -> เปรียบเทียบข้อมูลว่ามีการเปลี่ยนแปลงหรือไม่
          const hasChanged = 
            normalize(existing.thai) !== normalize(word.thai) ||
            normalize(existing.pos) !== normalize(word.pos) ||
            normalize(existing.category) !== normalize(word.category) ||
            normalize(existing.example) !== normalize(word.example) ||
            normalize(existing.synonyms) !== normalize(word.synonyms) ||
            normalize(existing.antonyms) !== normalize(word.antonyms) ||
            existing.sort_order !== word.sort_order ||
            existing.is_deleted === 1; // หากเคยถูกลบไปแล้ว (Soft delete) ให้กู้คืน

          if (hasChanged) {
            // ข้อมูลเปลี่ยน -> เก็บคำสั่ง UPDATE เฉพาะแถวที่ต่างจากเดิม
            statements.push(db.prepare(`
              UPDATE vocab_repository SET 
              thai = ?, pos = ?, category = ?, example = ?, synonyms = ?, antonyms = ?, 
              is_deleted = 0, sort_order = ?, updated_at = CURRENT_TIMESTAMP
              WHERE eng = ?
            `).bind(word.thai, word.pos, word.category, word.example, word.synonyms, word.antonyms, word.sort_order, word.eng));
            updatedCount++;
          }
        }
      }

      let deletedCount = 0;
      if (!isHardSync) {
        // --- 3. หาคำศัพท์ที่ถูกลบออกจาก Sheet (มีใน DB แต่ไม่มีใน Sheet) ---
        for (const [eng, row] of existingMap.entries()) {
          if (!sheetEngs.has(eng) && row.is_deleted === 0) {
            statements.push(db.prepare("UPDATE vocab_repository SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE eng = ?").bind(eng));
            deletedCount++;
          }
        }
      }

      // --- 4. บันทึกข้อมูลที่เปลี่ยนแปลงแบบ Batch (ทีละ 100 คำสั่ง) ประหยัดโควต้า ---
      const chunkSize = 100;
      for (let i = 0; i < statements.length; i += chunkSize) {
        const chunk = statements.slice(i, i + chunkSize);
        await db.batch(chunk);
      }

      const message = `เพิ่มใหม่ ${insertedCount} คำ, อัปเดต ${updatedCount} คำ, ลบ ${deletedCount} คำ`;
      return new Response(JSON.stringify({ status: "success", count: allWords.length, message }), {
        headers: { "Content-Type": "application/json" }
      });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}