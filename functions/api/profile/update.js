export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { generation, targetUni, targetFac, avatarId } = await context.request.json();
    const userId = context.data?.user?.userId;

    if (!userId) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { 
        status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
      });
    }

    const query = `UPDATE users SET generation = ?, target_uni = ?, target_fac = ?, avatar_id = ? WHERE id = ?`;
    await db.prepare(query).bind(generation, targetUni, targetFac, avatarId, userId).run();
    // เคลียร์แคชโปรไฟล์เก่าทิ้ง เพื่อให้โหลดข้อมูลใหม่จาก D1 ในการรีเฟรชครั้งต่อไป
    context.waitUntil(context.env.APP_KV.delete(`user_profile_${userId}`));

    return new Response(JSON.stringify({ status: "success", message: "อัปเดตข้อมูลสำเร็จ" }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
    });
  }
}