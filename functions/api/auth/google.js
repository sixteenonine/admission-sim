export async function onRequestPost(context) {
  try {
    if (!context.env.DB) {
      throw new Error("ไม่พบการเชื่อมต่อฐานข้อมูล (context.env.DB is undefined)");
    }
    
    const db = context.env.DB;
    const userInfo = await context.request.json();

    if (!userInfo || !userInfo.email) {
      throw new Error("ไม่พบข้อมูล Email จาก Google");
    }

    let user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(userInfo.email).first();
    const avatarUrl = userInfo.picture || null; // ดึงรูปล่าสุดจาก Google

    if (!user) {
      const newId = crypto.randomUUID();
      const displayName = userInfo.name || userInfo.email.split('@')[0];
      
      // บันทึก user ใหม่พร้อม avatar_url
      await db.prepare(
        "INSERT INTO users (id, email, display_name, avatar_id, plan_tier, avatar_url) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(newId, userInfo.email, displayName, 1, 'common', avatarUrl).run();

      user = { 
        id: newId, email: userInfo.email, display_name: displayName, 
        avatar_id: 1, plan_tier: 'common', avatar_url: avatarUrl 
      };
    } else {
      // ถ้ามี user อยู่แล้ว อัปเดตรูปโปรไฟล์ให้เป็นรูปล่าสุด
      if (avatarUrl && user.avatar_url !== avatarUrl) {
        await db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").bind(avatarUrl, user.id).run();
        user.avatar_url = avatarUrl;
      }
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        avatar_id: user.avatar_id,
        avatar_url: user.avatar_url, // ส่ง url รูปกลับไปที่หน้าบ้าน
        plan_tier: user.plan_tier,
        plan_expire_at: user.plan_expire_at,
        generation: user.generation,
        target_uni: user.target_uni,
        target_fac: user.target_fac,
        created_at: user.created_at
      } 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message || "Unknown Error" }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}