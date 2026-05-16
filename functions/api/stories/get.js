export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const kv = context.env.STORY_CONTENT;
    const { storyId } = await context.request.json();

    if (!storyId) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณาระบุรหัสเรื่องสั้น" }), { status: 400 });
    }

    // ดึงเฉพาะ Metadata ความปลอดภัยจาก D1
    const storyMeta = await db.prepare("SELECT id, title, image_url, is_premium FROM stories WHERE id = ?").bind(storyId).first();
    if (!storyMeta) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบเรื่องสั้นที่ต้องการ" }), { status: 404 });
    }

    // ดึงเนื้อหาอ่านและคลังคำศัพท์จาก KV ความเร็วสูง
    const kvDataStr = await kv.get(storyId);
    let content = "";
    let translation = "";
    let vocab_levels = {};

    if (kvDataStr) {
      const kvData = JSON.parse(kvDataStr);
      content = kvData.content || "";
      translation = kvData.translation || "";
      vocab_levels = kvData.vocab_levels || {};
    }

    const story = {
      ...storyMeta,
      content,
      translation,
      vocab_levels
    };

    return new Response(JSON.stringify({ status: "success", story }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}