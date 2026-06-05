export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const { storyId } = await request.json();
    
    await env.DB.prepare("DELETE FROM stories WHERE id = ?").bind(storyId).run();
    const cache = caches.default;
    const cacheUrl = new URL(request.url);
    
    cacheUrl.pathname = `/internal-cache/story/${storyId}`;
    context.waitUntil(cache.delete(new Request(cacheUrl.toString(), { method: 'GET' })));
    
    cacheUrl.pathname = '/internal-cache/stories/list';
    context.waitUntil(cache.delete(new Request(cacheUrl.toString(), { method: 'GET' })));

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