import { mutateStoriesListKV, writeSingleStoryToKV } from '../../../_shared/kvSync.js';

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { title, type, content, image_url, translation, vocab_levels, is_premium, status } = await context.request.json();

    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกชื่อเรื่อง (Title)" }), { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกเนื้อหา (Content)" }), { status: 400 });
    }

    const storyId = 'story-' + crypto.randomUUID();
    const storyType = type || 'story';
    const storyStatus = status || 'published';
    const createdAt = new Date().toISOString().replace('T', ' ').split('.')[0]; 
    
    const finalTranslation = storyType === 'story' ? (translation || '') : '';
    let finalVocab = {};
    if (storyType === 'story' && typeof vocab_levels === 'object' && vocab_levels !== null && !Array.isArray(vocab_levels)) {
        finalVocab = vocab_levels;
    }
    const isPremiumInt = is_premium ? 1 : 0;

    await db.prepare(`
      INSERT INTO stories (id, title, type, image_url, is_premium, content, translation, vocab_levels, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      storyId, title.trim(), storyType, image_url || '', isPremiumInt, content.trim(), finalTranslation, JSON.stringify(finalVocab), storyStatus, createdAt
    ).run();

    const listSummary = { id: storyId, title: title.trim(), image_url: image_url || '', is_premium: isPremiumInt, type: storyType, status: storyStatus, created_at: createdAt };
    const fullStoryData = { id: storyId, title: title.trim(), type: storyType, image_url: image_url || '', is_premium: isPremiumInt, content: content.trim(), translation: finalTranslation, vocab_levels: finalVocab, status: storyStatus, created_at: createdAt };

    context.waitUntil(Promise.allSettled([
      mutateStoriesListKV(context.env, 'add', listSummary),
      writeSingleStoryToKV(context.env, storyId, fullStoryData)
    ]));

    return new Response(JSON.stringify({ status: "success", message: "บันทึกข้อมูลเรียบร้อย", storyId }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}