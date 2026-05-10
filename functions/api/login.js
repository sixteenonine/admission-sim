async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { username, password } = await context.request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกข้อมูลให้ครบถ้วน" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    const hashedPassword = await hashPassword(password);
    
    // ดึงข้อมูลโดยไม่เอา password_hash ออกมาเพื่อความปลอดภัย
    const user = await db.prepare(
      "SELECT id, username, display_name FROM users WHERE username = ? AND password_hash = ?"
    ).bind(username, hashedPassword).first();

    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }), { 
        status: 401, headers: { "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ 
      status: "success", 
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name
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