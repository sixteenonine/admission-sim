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

    // 1. อ่านเฉพาะคีย์ (eng) เพื่อลดการใช้ RAM และ Read Quota อย่างมหาศาล
    const { results: existingEngs } = await db.prepare("SELECT eng FROM vocab_repository WHERE is_deleted = 0").all();
    const activeWords = new Set(existingEngs.map(r => r.eng));

    const chunkSize = 100;
    let processed = 0;

    // 2. โยนชุดคำสั่งเข้า DB ให้ทำงานระดับ Engine (Database-Level Diffing)
    for (let i = 0; i < allWords.length; i += chunkSize) {
      const chunk = allWords.slice(i, i + chunkSize);
      const chunkStatements = chunk.map(word => {
        activeWords.delete(word.eng); // หักล้างคำที่มีใน Sheet ออกจากรายการ
        
        return db.prepare(`
          INSERT INTO vocab_repository (eng, thai, pos, category, example, synonyms, antonyms, is_deleted, sort_order) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
          ON CONFLICT(eng) DO UPDATE SET 
          thai = excluded.thai, pos = excluded.pos, category = excluded.category, 
          example = excluded.example, synonyms = excluded.synonyms, antonyms = excluded.antonyms,
          is_deleted = 0, sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP
          WHERE 
          IFNULL(vocab_repository.thai, '') != IFNULL(excluded.thai, '') OR 
          IFNULL(vocab_repository.pos, '') != IFNULL(excluded.pos, '') OR 
          IFNULL(vocab_repository.category, '') != IFNULL(excluded.category, '') OR 
          IFNULL(vocab_repository.example, '') != IFNULL(excluded.example, '') OR 
          IFNULL(vocab_repository.synonyms, '') != IFNULL(excluded.synonyms, '') OR 
          IFNULL(vocab_repository.antonyms, '') != IFNULL(excluded.antonyms, '') OR 
          vocab_repository.sort_order != excluded.sort_order OR 
          vocab_repository.is_deleted = 1
        `).bind(word.eng, word.thai, word.pos, word.category, word.example, word.synonyms, word.antonyms, word.sort_order);
      });
      await db.batch(chunkStatements);
      processed += chunk.length;
    }

    // 3. นำคำที่ตกค้างใน Set ไปตั้งค่าลบ (Soft Delete)
    if (!isHardSync && activeWords.size > 0) {
      const deleteStmts = Array.from(activeWords).map(eng => 
        db.prepare("UPDATE vocab_repository SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE eng = ?").bind(eng)
      );
      for (let i = 0; i < deleteStmts.length; i += chunkSize) {
        await db.batch(deleteStmts.slice(i, i + chunkSize));
      }
    }

    const message = `ทำงานด้วยระบบ DB-Level Diffing สมบูรณ์`;
    return new Response(JSON.stringify({ status: "success", count: processed, message }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}