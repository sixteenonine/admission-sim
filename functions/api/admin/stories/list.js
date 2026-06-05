export async function onRequestGet(context) {
  try {
    const { request, env, waitUntil } = context;
    const db = env.DB;

    // สร้าง Cache Key สำหรับรายการบทความ
    const cache = caches.default;
    const cacheUrl = new URL(request.url);
    cacheUrl.pathname = '/internal-cache/stories/list';
    const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

    // ตรวจสอบแคชก่อน
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // ถ้าไม่มีแคช ค่อยคิวรี D1
    const { results } = await db.prepare(`
      SELECT id, title, image_url, is_premium, type, status 
      FROM stories 
      ORDER BY created_at DESC
    `).all();

    const responseData = JSON.stringify({ status: "success", stories: results });
    
    // สั่งแคชไว้ใน Worker 60 วินาที (หรือจนกว่าจะถูกเตะออก)
    const responseToCache = new Response(responseData, {
      headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=60" }
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