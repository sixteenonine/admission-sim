export async function onRequestPost(context) {
  try {
    const request = context.request;
    const { storyId } = await request.json();

    if (!storyId) {
      return new Response(JSON.stringify({ status: "error", message: "Missing storyId" }), { status: 400 });
    }

    // เจาะตรงเข้า D1 โดยไม่ต้องสนใจสถานะ 'published' หรือ 'draft' และไม่ผ่าน KV
    const story = await context.env.DB.prepare(`
      SELECT id, title, type, image_url, is_premium, content, translation, vocab_levels, status 
      FROM stories WHERE id = ?
    `).bind(storyId).first();

    if (!story) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบข้อมูลในระบบ" }), { status: 404 });
    }

    let parsedVocab = {};
    try {
      if (story.vocab_levels) parsedVocab = JSON.parse(story.vocab_levels);
    } catch (e) {
      console.error("JSON Parse Error for story vocab:", storyId);
    }
    story.vocab_levels = parsedVocab;

    // ส่งกลับทันทีโดยไม่มีการแคช (No Cache) เพื่อให้แอดมินเห็นของใหม่เสมอเวลาแก้คำผิด
    return new Response(JSON.stringify({ status: "success", story }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}