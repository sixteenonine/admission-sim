export async function syncStoriesListToKV(env) {
  const { results } = await env.DB.prepare(`
    SELECT id, title, image_url, is_premium, type, status 
    FROM stories 
    WHERE status = 'published'
    ORDER BY created_at DESC
  `).all();
  
  await env.APP_KV.put('stories_list', JSON.stringify({ status: "success", stories: results }));
}

export async function syncSingleStoryToKV(env, storyId) {
  const story = await env.DB.prepare(`
    SELECT id, title, type, image_url, is_premium, content, translation, vocab_levels, status 
    FROM stories WHERE id = ?
  `).bind(storyId).first();

  if (story) {
    let parsedVocab = {};
    try {
      if (story.vocab_levels) parsedVocab = JSON.parse(story.vocab_levels);
    } catch (e) {
      console.error("JSON Parse Error for story vocab:", storyId);
    }
    story.vocab_levels = parsedVocab;
    
    await env.APP_KV.put(`story_${storyId}`, JSON.stringify({ status: "success", story }));
  } else {
    await env.APP_KV.delete(`story_${storyId}`);
  }
}