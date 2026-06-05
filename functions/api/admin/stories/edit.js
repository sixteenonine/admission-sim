import { mutateStoriesListKV, writeSingleStoryToKV } from '../../../_shared/kvSync.js';

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { id, title, type, image_url, is_premium, content, translation, vocab_levels, status } = await context.request.json();
    
    if (!id || !title || !content) {
        return new Response(JSON.stringify({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน (ต้องการ id, title, content)' }), { status: 400 });
    }

    const storyType = type || 'story';
    const storyStatus = status || 'published';
    const finalTranslation = storyType === 'story' ? (translation || '') : '';
    let finalVocab = {};
    if (storyType === 'story' && typeof vocab_levels === 'object' && vocab_levels !== null && !Array.isArray(vocab_levels)) {
        finalVocab = vocab_levels;
    }
    const isPremiumInt = is_premium ? 1 : 0;
    
    await db.prepare(`
      UPDATE stories SET title = ?, type = ?, image_url = ?, is_premium = ?, content = ?, translation = ?, vocab_levels = ?, status = ? WHERE id = ?
    `).bind(
      title.trim(), storyType, image_url || '', isPremiumInt, content.trim(), finalTranslation, JSON.stringify(finalVocab), storyStatus, id
    ).run();

    const listSummary = { id, title: title.trim(), image_url: image_url || '', is_premium: isPremiumInt, type: storyType, status: storyStatus };
    const fullStoryData = { id, title: title.trim(), type: storyType, image_url: image_url || '', is_premium: isPremiumInt, content: content.trim(), translation: finalTranslation, vocab_levels: finalVocab, status: storyStatus };

    context.waitUntil(Promise.allSettled([
      mutateStoriesListKV(context.env, 'edit', listSummary),
      writeSingleStoryToKV(context.env, id, fullStoryData)
    ]));

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}