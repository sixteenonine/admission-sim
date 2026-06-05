import { syncStoriesListToKV, syncSingleStoryToKV } from '../../../_shared/kvSync.js';
export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { id, title, type, image_url, is_premium, content, translation, vocab_levels, status } = await context.request.json();
    
    // 1. Validation 
    if (!id || !title || !content) {
        return new Response(JSON.stringify({ status: 'error', message: 'ข้อมูลไม่ครบถ้วน (ต้องการ id, title, content)' }), { status: 400 });
    }

    const storyType = type || 'story';
    const storyStatus = status || 'published';

    // 2. Sanitization
    const finalTranslation = storyType === 'story' ? (translation || '') : '';
    let finalVocab = {};
    if (storyType === 'story' && vocab_levels) {
        if (typeof vocab_levels === 'object' && vocab_levels !== null && !Array.isArray(vocab_levels)) {
            finalVocab = vocab_levels;
        }
    }
    
    // 3. อัปเดตข้อมูลม้วนเดียวจบลง D1 
    await db.prepare(`
      UPDATE stories 
      SET title = ?, type = ?, image_url = ?, is_premium = ?, content = ?, translation = ?, vocab_levels = ?, status = ? 
      WHERE id = ?
    `)
    .bind(
      title.trim(), 
      storyType, 
      image_url || '', 
      is_premium ? 1 : 0, 
      content.trim(), 
      finalTranslation, 
      JSON.stringify(finalVocab), 
      storyStatus,
      id
    ).run();

    context.waitUntil(syncStoriesListToKV(context.env));
    context.waitUntil(syncSingleStoryToKV(context.env, id));

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