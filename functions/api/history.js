export async function onRequestGet(context) {
  try {
    const userId = context.data?.user?.userId;
    if (!userId) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { status: 401 });
    }

    // 1. ลองดึงจาก KV
    let historyData = await context.env.APP_KV.get(`user_history_${userId}`, "json");

    // 2. ถ้าไม่มี ค่อยไปเอาจาก D1 (และอัปเดตกลับลง KV)
    if (!historyData) {
      const db = context.env.DB;
      const { results } = await db.prepare(
        "SELECT reflection_data FROM exam_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 30"
      ).bind(userId).all();
      
      historyData = results.map(row => JSON.parse(row.reflection_data));
      
      context.waitUntil(context.env.APP_KV.put(`user_history_${userId}`, JSON.stringify(historyData)));
    }

    return new Response(JSON.stringify({ status: "success", data: historyData }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-cache" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}