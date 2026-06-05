import { syncStoriesListToKV, syncSingleStoryToKV } from '../../../_shared/kvSync.js';

export async function onRequestPost(context) {
  try {
    // 1. ซิงค์ List หลัก
    await syncStoriesListToKV(context.env);

    // 2. ดึง ID ทั้งหมดมาเพื่อซิงค์รายตัว
    const { results } = await context.env.DB.prepare('SELECT id FROM stories').all();
    
    for (const story of results) {
      await syncSingleStoryToKV(context.env, story.id);
    }

    return new Response(JSON.stringify({ status: "success", message: "Force Sync D1 to KV สำเร็จ" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}