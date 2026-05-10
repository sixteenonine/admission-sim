export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { username, password } = await context.request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ status: "error", message: "ข้อมูลไม่ครบถ้วน" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // ค้นหาผู้ใช้จาก Username
    const user = await db.prepare(
      "SELECT id, username, display_name as displayName, password_hash FROM users WHERE username = ?"
    ).bind(username).first();

    // ตรวจสอบรหัสผ่าน
    if (!user || user.password_hash !== password) {
      return new Response(JSON.stringify({ status: "error", message: "Username หรือ Password ไม่ถูกต้อง" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      user: { id: user.id, username: user.username, displayName: user.displayName } 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}