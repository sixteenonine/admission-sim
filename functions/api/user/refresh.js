export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { userId } = await context.request.json();

    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบผู้ใช้" }), { status: 404 });
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      user: { 
        id: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        avatar_id: user.avatar_id,
        plan_tier: user.plan_tier,
        plan_expire_at: user.plan_expire_at
      } 
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}