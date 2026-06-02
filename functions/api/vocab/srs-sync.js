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

    if (!context.env.VOCAB_SYNC_QUEUE) {
      throw new Error('VOCAB_SYNC_QUEUE binding is missing in Cloudflare Pages');
    }

    await context.env.VOCAB_SYNC_QUEUE.send({ userId, updates });
    
    return new Response(JSON.stringify({ success: true, synced_count: updates.length, queued: true }), { 
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