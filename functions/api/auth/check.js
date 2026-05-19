export async function onRequestGet(context) {
  try {
    // 1. ดึง userId จาก Middleware ที่ผ่านการตรวจสอบ JWT แล้ว
    const userPayload = context.data?.user;
    
    if (!userPayload || !userPayload.userId) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { 
        status: 401, headers: { "Content-Type": "application/json" } 
      });
    }

    const db = context.env.DB;
    const userId = userPayload.userId;

    // 2. ดึงข้อมูลโปรไฟล์ล่าสุดจากฐานข้อมูล (เพื่อให้อัปเดตสถานะ Premium ตลอดเวลา)
    const user = await db.prepare(
      "SELECT id, email, display_name, avatar_id, avatar_url, plan_tier, plan_expire_at, generation, target_uni, target_fac, created_at FROM users WHERE id = ?"
    ).bind(userId).first();

    if (!user) {
      // กรณีบัญชีถูกลบออกจากฐานข้อมูลไปแล้ว แต่ Token ยังไม่หมดอายุ
      return new Response(JSON.stringify({ status: "error", message: "User not found" }), { 
        status: 404, headers: { "Content-Type": "application/json" } 
      });
    }

    // 3. ส่งข้อมูลกลับไปให้หน้าบ้าน
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
    }), { 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}