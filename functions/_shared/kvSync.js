// 1. In-Memory Mutation (Zero D1 Read)
export async function mutateStoriesListKV(env, action, storySummary) {
  try {
    const listData = await env.APP_KV.get('stories_list', 'json');
    let stories = listData?.stories || [];

    if (action === 'add') {
      if (storySummary.status === 'published') stories.unshift(storySummary);
    } else if (action === 'edit') {
      const index = stories.findIndex(s => s.id === storySummary.id);
      if (storySummary.status === 'published') {
        if (index !== -1) {
          stories[index] = { ...stories[index], ...storySummary };
        } else {
          stories.unshift(storySummary);
        }
      } else {
        if (index !== -1) stories.splice(index, 1);
      }
    } else if (action === 'delete') {
      stories = stories.filter(s => s.id !== storySummary.id);
    }

    stories.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    await env.APP_KV.put('stories_list', JSON.stringify({ status: "success", stories }));
  } catch (e) {
    console.error("List KV Mutation Error:", e);
  }
}

export async function writeSingleStoryToKV(env, storyId, fullStoryData) {
  if (fullStoryData.status === 'published') {
    await env.APP_KV.put(`story_${storyId}`, JSON.stringify({ status: "success", story: fullStoryData }));
  } else {
    await env.APP_KV.delete(`story_${storyId}`);
  }
}

// 2. Emergency Fallback (Force Sync D1 -> KV)
export async function forceSyncStoriesListToKV(env) {
  const { results } = await env.DB.prepare(`
    SELECT id, title, image_url, is_premium, type, status, created_at 
    FROM stories WHERE status = 'published' ORDER BY created_at DESC
  `).all();
  await env.APP_KV.put('stories_list', JSON.stringify({ status: "success", stories: results }));
}

export async function forceSyncSingleStoryToKV(env, storyId) {
  const story = await env.DB.prepare(`
    SELECT id, title, type, image_url, is_premium, content, translation, vocab_levels, status, created_at 
    FROM stories WHERE id = ? AND status = 'published'
  `).bind(storyId).first();

  if (story) {
    let parsedVocab = {};
    try { if (story.vocab_levels) parsedVocab = JSON.parse(story.vocab_levels); } catch (e) {}
    story.vocab_levels = parsedVocab;
    await env.APP_KV.put(`story_${storyId}`, JSON.stringify({ status: "success", story }));
  } else {
    await env.APP_KV.delete(`story_${storyId}`);
  }
}