export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const kv = context.env.STORY_CONTENT;
    const { title, content, image_url, translation, vocab_levels, is_premium } = await context.request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกข้อมูลชื่อเรื่องและเนื้อหา" }), { status: 400 });
    }

    const storyId = 'story-' + crypto.randomUUID();

    // 1. บันทึกทะเบียนลิสต์รายการลง D1
    await db.prepare("INSERT INTO stories (id, title, image_url, is_premium) VALUES (?, ?, ?, ?)")
            .bind(storyId, title, image_url, is_premium ? 1 : 0).run();

    // 2. บันทึกเนื้อหาขนาดใหญ่แยกไปลง KV
    const kvPayload = {
      content,
      translation,
      vocab_levels: vocab_levels || {}
    };
    await kv.put(storyId, JSON.stringify(kvPayload));

    return new Response(JSON.stringify({ status: "success", message: "บันทึกเรื่องสั้นเรียบร้อย", storyId }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}