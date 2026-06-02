export async function onRequestGet(context) {
  try {
    const db = context.env.DB;
    const userId = context.data?.user?.userId;

    if (!userId) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { 
        status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
      });
    }

    const { results } = await db.prepare(
      "SELECT reflection_data FROM exam_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 30"
    ).bind(userId).all();
    
    const historyData = results.map(row => JSON.parse(row.reflection_data));

    return new Response(JSON.stringify({ status: "success", data: historyData }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
    });
  }
}