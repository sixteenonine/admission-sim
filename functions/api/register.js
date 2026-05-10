export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { username, password, displayName } = await context.request.json();

    if (!username || !password || !displayName) {
      return new Response(JSON.stringify({ status: "error", message: "ข้อมูลไม่ครบถ้วน" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // เช็กว่ามี Username นี้หรือยัง
    const existingUser = await db.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
    if (existingUser) {
      return new Response(JSON.stringify({ status: "error", message: "มี Username นี้ในระบบแล้ว" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    const userId = crypto.randomUUID();
    
    // บันทึกลงฐานข้อมูล (เก็บรหัสผ่านแบบง่ายเพื่อความรวดเร็วในการใช้งานเบื้องต้น)
    await db.prepare(
      "INSERT INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)"
    ).bind(userId, username, password, displayName).run();

    return new Response(JSON.stringify({ status: "success", message: "สมัครสมาชิกสำเร็จ" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}