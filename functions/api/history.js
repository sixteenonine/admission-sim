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
      "SELECT reflection_data FROM exam_history WHERE user_id = ? ORDER BY created_at DESC"
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

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { mode, score, reflectionData } = await context.request.json();
    const userId = context.data?.user?.userId;

    if (!userId) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { 
        status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
      });
    }

    if (!reflectionData) {
      return new Response(JSON.stringify({ status: "error", message: "ข้อมูลไม่ครบถ้วน" }), { 
        status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
      });
    }

    const historyId = reflectionData.id || crypto.randomUUID();

    await db.prepare(
      "INSERT INTO exam_history (id, user_id, mode, score, reflection_data) VALUES (?, ?, ?, ?, ?)"
    ).bind(historyId, userId, mode || "full", score || 0, JSON.stringify(reflectionData)).run();

    return new Response(JSON.stringify({ status: "success", message: "บันทึกประวัติสำเร็จ" }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
    });
  }
}