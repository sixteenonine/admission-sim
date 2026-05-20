export async function onRequestPost(context) {
  try {
    const { batchId } = await context.request.json();
    if (!batchId) return new Response(JSON.stringify({ status: "error" }), { status: 400 });

    const db = context.env.DB;
    // มาร์คคำที่ไม่มีรหัสซิงก์รอบล่าสุดให้กลายเป็น "ถูกลบ" (Soft Delete)
    await db.prepare(`
      UPDATE vocab_repository 
      SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE sync_batch_id != ? AND is_deleted = 0
    `).bind(batchId).run();

    return new Response(JSON.stringify({ status: "success" }));
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}