export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { storyId } = await context.request.json();

    if (!storyId) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณาระบุรหัสบทความ" }), { status: 400 });
    }

    // ดึงข้อมูลทั้งหมดในครั้งเดียวจาก D1
    const story = await db.prepare(`
      SELECT id, title, type, image_url, is_premium, content, translation, vocab_levels, status 
      FROM stories WHERE id = ?
    `).bind(storyId).first();
    
    if (!story) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบข้อมูลในระบบ (หรือถูกลบไปแล้ว)" }), { status: 404 });
    }

    // แปลง vocab_levels ที่เป็น String (JSON) กลับเป็น Object 
    let parsedVocab = {};
    try {
      if (story.vocab_levels) parsedVocab = JSON.parse(story.vocab_levels);
    } catch (e) {
      console.error("JSON Parse Error for story vocab:", storyId);
    }
    
    story.vocab_levels = parsedVocab;

    return new Response(JSON.stringify({ status: "success", story }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}