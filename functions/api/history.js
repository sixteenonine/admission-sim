export async function onRequestGet(context) {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ status: "error", message: "Missing userId" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // ดึงประวัติทั้งหมดของ User คนนี้ เรียงจากใหม่ไปเก่า
    const { results } = await db.prepare(
      "SELECT reflection_data FROM exam_history WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(userId).all();
    
    // แปลง JSON string กลับเป็น Object เพื่อส่งให้ฝั่งหน้าเว็บนำไปแสดงผล
    const historyData = results.map(row => JSON.parse(row.reflection_data));

    return new Response(JSON.stringify({ status: "success", data: historyData }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { userId, mode, score, reflectionData } = await context.request.json();

    if (!userId || !reflectionData) {
      return new Response(JSON.stringify({ status: "error", message: "ข้อมูลไม่ครบถ้วน" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // ใช้ ID เดิมจากก้อนข้อมูล หรือสร้างใหม่ถ้าไม่มี
    const historyId = reflectionData.id || crypto.randomUUID();

    await db.prepare(
      "INSERT INTO exam_history (id, user_id, mode, score, reflection_data) VALUES (?, ?, ?, ?, ?)"
    ).bind(historyId, userId, mode || "full", score || 0, JSON.stringify(reflectionData)).run();

    return new Response(JSON.stringify({ status: "success", message: "บันทึกประวัติสำเร็จ" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}