export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { storyId } = await context.request.json();

    if (!storyId) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณาระบุรหัสเรื่องสั้น" }), { status: 400 });
    }

    const story = await db.prepare("SELECT * FROM stories WHERE id = ?").bind(storyId).first();

    if (!story) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบเรื่องสั้นที่ต้องการ" }), { status: 404 });
    }

    // แปลงข้อมูลคำศัพท์แยกเลเวลจาก Text (JSON String) กลับเป็น Object
    if (story.vocab_levels) {
      try {
        story.vocab_levels = JSON.parse(story.vocab_levels);
      } catch (e) {
        story.vocab_levels = {};
      }
    }

    return new Response(JSON.stringify({ status: "success", story }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}