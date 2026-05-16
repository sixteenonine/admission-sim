export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { userId, generation, targetUni, targetFac, avatarId } = await context.request.json();

    if (!userId) {
      return new Response(JSON.stringify({ status: "error", message: "User ID is required" }), { status: 400 });
    }

    const query = `UPDATE users SET generation = ?, target_uni = ?, target_fac = ?, avatar_id = ? WHERE id = ?`;
    await db.prepare(query).bind(generation, targetUni, targetFac, avatarId, userId).run();

    return new Response(JSON.stringify({ status: "success", message: "อัปเดตข้อมูลสำเร็จ" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}