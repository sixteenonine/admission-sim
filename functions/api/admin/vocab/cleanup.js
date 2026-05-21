export async function onRequestPost(context) {
  try {
    const { activeKeys } = await context.request.json();
    if (!activeKeys || !Array.isArray(activeKeys)) return new Response(JSON.stringify({ status: "error" }), { status: 400 });

    const db = context.env.DB;
    
    // 1. ดึงคีย์ทั้งหมดจากฐานข้อมูล (ใช้ Read Quota แค่ 1 ครั้ง ประหยัดมาก)
    const { results: existingRows } = await db.prepare("SELECT eng FROM vocab_repository WHERE is_deleted = 0").all();
    
    const sheetKeysSet = new Set(activeKeys);
    const toDelete = [];

    // 2. เปรียบเทียบหาคำใน DB ที่หายไปจาก Google Sheets
    for (const row of existingRows) {
      if (!sheetKeysSet.has(row.eng)) {
        toDelete.push(row.eng);
      }
    }

    // 3. สั่งลบ (Soft Delete) เฉพาะคำที่หายไปจริงๆ โดยรันทีละ Batch
    let processed = 0;
    const chunkSize = 100;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const chunk = toDelete.slice(i, i + chunkSize);
      const statements = chunk.map(eng => 
        db.prepare("UPDATE vocab_repository SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE eng = ?").bind(eng)
      );
      await db.batch(statements);
      processed += chunk.length;
    }

    return new Response(JSON.stringify({ status: "success", deletedCount: processed }));
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}