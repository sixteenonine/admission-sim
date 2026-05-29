export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { chunk, batchId } = payload;
    const db = context.env.DB;

    if (!chunk || !Array.isArray(chunk)) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่มีข้อมูล Chunk หรือข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const chunkStatements = chunk.map(word => {
      return db.prepare(`
        INSERT INTO vocab_repository (eng, thai, pos, category, example, synonyms, antonyms, sync_batch_id, is_deleted, sort_order) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        ON CONFLICT(eng) DO UPDATE SET 
        thai = excluded.thai, pos = excluded.pos, category = excluded.category, 
        example = excluded.example, synonyms = excluded.synonyms, antonyms = excluded.antonyms,
        sync_batch_id = excluded.sync_batch_id, is_deleted = 0, sort_order = excluded.sort_order, updated_at = CURRENT_TIMESTAMP
        WHERE 
        IFNULL(vocab_repository.thai, '') != IFNULL(excluded.thai, '') OR 
        IFNULL(vocab_repository.pos, '') != IFNULL(excluded.pos, '') OR 
        IFNULL(vocab_repository.category, '') != IFNULL(excluded.category, '') OR 
        IFNULL(vocab_repository.example, '') != IFNULL(excluded.example, '') OR 
        IFNULL(vocab_repository.synonyms, '') != IFNULL(excluded.synonyms, '') OR 
        IFNULL(vocab_repository.antonyms, '') != IFNULL(excluded.antonyms, '') OR 
        vocab_repository.sort_order != excluded.sort_order OR 
        vocab_repository.is_deleted = 1
      `).bind(word.eng, word.thai ?? null, word.pos ?? null, word.category ?? null, word.example ?? null, word.synonyms ?? null, word.antonyms ?? null, batchId, word.sort_order);
    });

    const d1BatchLimit = 100;
    let processed = 0;
    for (let i = 0; i < chunkStatements.length; i += d1BatchLimit) {
      await db.batch(chunkStatements.slice(i, i + d1BatchLimit));
      processed += Math.min(d1BatchLimit, chunkStatements.length - i);
    }

    return new Response(JSON.stringify({ status: "success", count: processed }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}