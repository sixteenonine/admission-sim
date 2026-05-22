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
        INSERT INTO user_vocab_progress (user_id, vocab_id, status, interval, ease_factor, next_review_date, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, vocab_id) DO UPDATE SET
          status = excluded.status,
          interval = excluded.interval,
          ease_factor = excluded.ease_factor,
          next_review_date = excluded.next_review_date,
          last_updated = CURRENT_TIMESTAMP
      `).bind(userId, u.vocab_id, u.status, u.interval, u.ease_factor, u.next_review_date)
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