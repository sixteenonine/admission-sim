export async function onRequestPost(context) {
  try {
    const { request, env, waitUntil } = context;
    const db = env.DB;
    
    const reqBody = await request.clone().json();
    const { storyId } = reqBody;

    if (!storyId) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณาระบุรหัสบทความ" }), { status: 400 });
    }

    const cache = caches.default;
    const cacheUrl = new URL(request.url);
    cacheUrl.pathname = `/internal-cache/story/${storyId}`;
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const story = await db.prepare(`
      SELECT id, title, type, image_url, is_premium, content, translation, vocab_levels, status 
      FROM stories WHERE id = ?
    `).bind(storyId).first();

    if (!story) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบข้อมูลในระบบ (หรือถูกลบไปแล้ว)" }), { status: 404 });
    }

    let parsedVocab = {};
    try {
      if (story.vocab_levels) parsedVocab = JSON.parse(story.vocab_levels);
    } catch (e) {
      console.error("JSON Parse Error for story vocab:", storyId);
    }
    story.vocab_levels = parsedVocab;

    const responseData = JSON.stringify({ status: "success", story });
    const responseToCache = new Response(responseData, {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=60" 
      }
    });

    waitUntil(cache.put(cacheKey, responseToCache.clone()));

    return new Response(responseData, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}