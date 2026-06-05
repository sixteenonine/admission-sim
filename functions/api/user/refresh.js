export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { userId } = await context.request.json();

    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบผู้ใช้" }), { status: 404 });
    }
    // อัปเดตข้อมูลล่าสุดลง KV ทันทีเพื่อปิดรอยรั่ว D1 Read ในอนาคต
    context.waitUntil(context.env.APP_KV.put(`user_profile_${userId}`, JSON.stringify(user)));

    return new Response(JSON.stringify({ 
      status: "success", 
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        avatar_id: user.avatar_id,
        avatar_url: user.avatar_url,
        plan_tier: user.plan_tier,
        plan_expire_at: user.plan_expire_at,
        generation: user.generation,
        target_uni: user.target_uni,
        target_fac: user.target_fac,
        created_at: user.created_at
      } 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}