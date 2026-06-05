export async function onRequestGet(context) {
  try {
    const { request, env, waitUntil } = context;
    const url = new URL(request.url);
    const storyId = url.searchParams.get('id');

    if (!storyId) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณาระบุรหัสบทความ" }), { status: 400 });
    }

    const cache = caches.default;
    // ใช้ URL ตรงๆ เป็น Cache Key เพื่อให้ Edge Cache ทำงานได้ 100%
    const cacheKey = new Request(url.toString(), request);

    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const responseData = await env.APP_KV.get(`story_${storyId}`);
    
    if (!responseData) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบข้อมูลในระบบ (หรือถูกลบไปแล้ว)" }), { status: 404 });
    }

    // Enterprise Stale-While-Revalidate (SWR)
    const responseToCache = new Response(responseData, {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
      }
    });

    waitUntil(cache.put(cacheKey, responseToCache.clone()));

    return responseToCache;
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}