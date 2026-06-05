import { syncSingleStoryToKV } from '../../_shared/kvSync.js';
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

    let responseData = await env.APP_KV.get(`story_${storyId}`);
    
    // Fallback
    if (!responseData) {
      await syncSingleStoryToKV(env, storyId);
      responseData = await env.APP_KV.get(`story_${storyId}`);
    }

    if (!responseData) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบข้อมูลในระบบ (หรือถูกลบไปแล้ว)" }), { status: 404 });
    }

    const responseToCache = new Response(responseData, {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" 
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