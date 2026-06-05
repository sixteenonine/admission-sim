export async function onRequestGet(context) {
  try {
    // 1. ดึง userId จาก Middleware ที่ผ่านการตรวจสอบ JWT แล้ว
    const userPayload = context.data?.user;
    
    if (!userPayload || !userPayload.userId) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { 
        status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }

    const db = context.env.DB;
    const userId = userPayload.userId;

    // 2. ดึงข้อมูลโปรไฟล์จาก KV (Zero-D1-Read)
    let user = await context.env.APP_KV.get(`user_profile_${userId}`, "json");

    // Safe Fallback: เนื่องจาก API นี้ป้องกันด้วย JWT จึงปลอดภัยที่จะดึง D1 เมื่อแคชหลุด แล้วอัปเดต KV ทันที
    if (!user) {
      user = await db.prepare(
        "SELECT id, email, display_name, avatar_id, avatar_url, plan_tier, plan_expire_at, generation, target_uni, target_fac, created_at FROM users WHERE id = ?"
      ).bind(userId).first();
      
      if (user) {
        context.waitUntil(context.env.APP_KV.put(`user_profile_${userId}`, JSON.stringify(user)));
      }
    }

    if (!user) {
      // กรณีบัญชีถูกลบออกจากฐานข้อมูลไปแล้ว แต่ Token ยังไม่หมดอายุ
      return new Response(JSON.stringify({ status: "error", message: "User not found" }), { 
        status: 404, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
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
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
}