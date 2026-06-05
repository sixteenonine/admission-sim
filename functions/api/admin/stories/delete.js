import { syncStoriesListToKV } from '../../../_shared/kvSync.js';
export async function onRequestPost(context) {
  const { env, request } = context;
  try {
    const { storyId } = await request.json();
    
    await env.DB.prepare("DELETE FROM stories WHERE id = ?").bind(storyId).run();
    context.waitUntil(syncStoriesListToKV(env));
    context.waitUntil(env.APP_KV.delete(`story_${storyId}`));

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