export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const { id, title, type, image_url, is_premium, content, translation, vocab_levels } = await request.json();
    const storyType = type || 'story';
    
    // อัปเดต D1 (เพิ่ม type)
    await env.DB.prepare("UPDATE stories SET title = ?, type = ?, image_url = ?, is_premium = ? WHERE id = ?")
            .bind(title, storyType, image_url, is_premium ? 1 : 0, id).run();

    // อัปเดต KV
    const kvPayload = { 
      content, 
      translation: storyType === 'story' ? translation : '', 
      vocab_levels: storyType === 'story' ? (vocab_levels || {}) : {} 
    };
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