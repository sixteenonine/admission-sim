import { syncStoriesListToKV } from '../../_shared/kvSync.js';
export async function onRequestGet(context) {
  try {
    let kvData = await context.env.APP_KV.get('stories_list');
    
    // Fallback: ถ้ายังไม่มีใน KV ให้ซิงค์จาก D1 ด่วนแล้วดึงใหม่
    if (!kvData) {
      await syncStoriesListToKV(context.env);
      kvData = await context.env.APP_KV.get('stories_list') || JSON.stringify({ status: "success", stories: [] });
    }

    return new Response(kvData, {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}