export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { title, type, content, image_url, translation, vocab_levels, is_premium, status } = await context.request.json();

    // 1. Validation ดักจับข้อมูลว่าง หรือ Type ผิดปกติ
    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกชื่อเรื่อง (Title)" }), { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกเนื้อหา (Content)" }), { status: 400 });
    }

    const storyId = 'story-' + crypto.randomUUID();
    const storyType = type || 'story';
    const storyStatus = status || 'published'; // รองรับ Lifecycle 

    // 2. Data Sanitization กำจัดขยะตามประเภทของบทความ
    const finalTranslation = storyType === 'story' ? (translation || '') : '';
    let finalVocab = {};
    if (storyType === 'story' && vocab_levels) {
        if (typeof vocab_levels === 'object' && vocab_levels !== null && !Array.isArray(vocab_levels)) {
            finalVocab = vocab_levels;
        }
    }

    // 3. บันทึกทุกอย่างลง D1 แบบ Single Source of Truth (รับประกัน ACID)
    await db.prepare(`
      INSERT INTO stories (id, title, type, image_url, is_premium, content, translation, vocab_levels, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      storyId, 
      title.trim(), 
      storyType, 
      image_url || '', 
      is_premium ? 1 : 0, 
      content.trim(), 
      finalTranslation, 
      JSON.stringify(finalVocab), // แปลง JSON ลง TEXT
      storyStatus
    ).run();

    return new Response(JSON.stringify({ status: "success", message: "บันทึกข้อมูลเรียบร้อย", storyId }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}