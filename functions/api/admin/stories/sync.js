import { forceSyncStoriesListToKV, forceSyncSingleStoryToKV } from '../../../_shared/kvSync.js';

export async function onRequestPost(context) {
  try {
    await forceSyncStoriesListToKV(context.env);

    const { results } = await context.env.DB.prepare("SELECT id FROM stories WHERE status = 'published'").all();
    
    const CHUNK_SIZE = 50;
    for (let i = 0; i < results.length; i += CHUNK_SIZE) {
      const chunk = results.slice(i, i + CHUNK_SIZE);
      await Promise.allSettled(chunk.map(story => forceSyncSingleStoryToKV(context.env, story.id)));
    }

    return new Response(JSON.stringify({ status: "success", message: "Force Sync D1 to KV สำเร็จ (Emergency Mode)" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}