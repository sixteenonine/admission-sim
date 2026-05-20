export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const kv = context.env.STORY_CONTENT;
    const { title, type, content, image_url, translation, vocab_levels, is_premium } = await context.request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกข้อมูลชื่อเรื่องและเนื้อหา" }), { status: 400 });
    }

    const storyId = 'story-' + crypto.randomUUID();
    const storyType = type || 'story';

    // 1. บันทึกทะเบียนลิสต์รายการลง D1 (เพิ่ม type)
    await db.prepare("INSERT INTO stories (id, title, type, image_url, is_premium) VALUES (?, ?, ?, ?, ?)")
            .bind(storyId, title, storyType, image_url, is_premium ? 1 : 0).run();

    // 2. บันทึกเนื้อหาขนาดใหญ่แยกไปลง KV
    const kvPayload = {
      content,
      translation: storyType === 'story' ? translation : '', // Speedread ไม่ต้องแปล
      vocab_levels: storyType === 'story' ? (vocab_levels || {}) : {} // Speedread ไม่ต้องมี vocab
    };
    await kv.put(storyId, JSON.stringify(kvPayload));

    return new Response(JSON.stringify({ status: "success", message: "บันทึกข้อมูลเรียบร้อย", storyId }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}