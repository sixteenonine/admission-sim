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
    
    if (!user) {
      const newId = crypto.randomUUID();
      const displayName = userInfo.name || userInfo.email.split('@')[0];
      
      await db.prepare(
        "INSERT INTO users (id, email, display_name, avatar_id, plan_tier) VALUES (?, ?, ?, ?, ?)"
      ).bind(newId, userInfo.email, displayName, 1, 'common').run();
      
      user = { id: newId, email: userInfo.email, display_name: displayName, avatar_id: 1, plan_tier: 'common' };
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        avatar_id: user.avatar_id,
        plan_tier: user.plan_tier 
      } 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message || "Unknown Error" }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}