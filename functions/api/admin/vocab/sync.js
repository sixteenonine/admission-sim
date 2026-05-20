export async function onRequestPost(context) {
  try {
    const { chunk } = await context.request.json();
    if (!chunk || !Array.isArray(chunk)) return new Response(JSON.stringify({ status: "error", message: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });

    const db = context.env.DB;
    
    // แปลงข้อมูลเป็นชุดคำสั่ง SQL (Upsert)
    const statements = chunk.map(word => {
      return db.prepare(`
        INSERT INTO vocab_repository (eng, thai, pos, category, example, synonyms, antonyms) 
        VALUES (?, ?, ?, ?, ?, ?, ?) 
        ON CONFLICT(eng) DO UPDATE SET 
        thai = excluded.thai, pos = excluded.pos, category = excluded.category, 
        example = excluded.example, synonyms = excluded.synonyms, antonyms = excluded.antonyms,
        updated_at = CURRENT_TIMESTAMP
      `).bind(word.eng, word.thai, word.pos, word.category, word.example, word.synonyms, word.antonyms);
    });

    // บันทึกรวดเดียวตามขนาดก้อน
    await db.batch(statements);

    return new Response(JSON.stringify({ status: "success", count: chunk.length }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}