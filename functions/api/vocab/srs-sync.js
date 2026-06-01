export async function onRequestPost(context) {
  try {
    const req = await context.request.json();
    const { userId, updates } = req;
    
    if (!userId || !Array.isArray(updates)) {
      return new Response(JSON.stringify({ error: 'Invalid payload format' }), { status: 400 });
    }
    
    if (updates.length > 50) {
      return new Response(JSON.stringify({ error: 'Payload too large (Max 50 items)' }), { status: 413 });
    }

    const db = context.env.DB;
    const statements = updates.map(u => 
      db.prepare(`
        INSERT INTO user_vocab_progress (user_id, vocab_id, status, interval, ease_factor, next_review_date, revision, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, vocab_id) DO UPDATE SET
          status = CASE WHEN excluded.revision > revision OR (excluded.revision = revision AND excluded.interval > interval) THEN excluded.status ELSE status END,
          interval = CASE WHEN excluded.revision > revision OR (excluded.revision = revision AND excluded.interval > interval) THEN excluded.interval ELSE interval END,
          ease_factor = CASE WHEN excluded.revision > revision OR (excluded.revision = revision AND excluded.interval > interval) THEN excluded.ease_factor ELSE ease_factor END,
          next_review_date = CASE WHEN excluded.revision > revision OR (excluded.revision = revision AND excluded.interval > interval) THEN excluded.next_review_date ELSE next_review_date END,
          revision = CASE WHEN excluded.revision > revision OR (excluded.revision = revision AND excluded.interval > interval) THEN excluded.revision ELSE revision END,
          last_updated = CURRENT_TIMESTAMP
      `).bind(userId, u.vocab_id, u.status, u.interval, u.ease_factor, u.next_review_date, u.revision || 0)
    );

    if (statements.length > 0) {
      await db.batch(statements);
    }
    
    return new Response(JSON.stringify({ success: true, synced_count: updates.length }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
export async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const userId = searchParams.get('userId');
    if (!userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });

    const db = context.env.DB;
    const { results } = await db.prepare(`
      SELECT p.interval, p.ease_factor, p.next_review_date, p.revision, v.eng, p.vocab_id 
          FROM user_vocab_progress p 
          JOIN vocab_repository v ON p.vocab_id = v.id 
          WHERE p.user_id = ?
        `).bind(userId).all();
    
    return new Response(JSON.stringify({ status: 'success', data: results }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}