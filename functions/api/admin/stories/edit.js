export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const { id, title, image_url, is_premium, content, translation, vocab_levels } = await request.json();
    
    await env.DB.prepare("UPDATE stories SET title = ?, image_url = ?, is_premium = ? WHERE id = ?")
            .bind(title, image_url, is_premium ? 1 : 0, id).run();

    const kvPayload = { title, content, translation, vocab_levels };
    await env.STORY_CONTENT.put(id, JSON.stringify(kvPayload));

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}