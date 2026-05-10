async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { username, password, displayName } = await context.request.json();

    if (!username || !password || !displayName) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกข้อมูลให้ครบถ้วน" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    const checkUser = await db.prepare("SELECT username FROM users WHERE username = ?").bind(username).first();
    if (checkUser) {
      return new Response(JSON.stringify({ status: "error", message: "ชื่อผู้ใช้งานนี้มีในระบบแล้ว" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    await db.prepare(
      "INSERT INTO users (id, username, password_hash, display_name) VALUES (?, ?, ?, ?)"
    ).bind(userId, username, hashedPassword, displayName).run();

    return new Response(JSON.stringify({ status: "success", message: "สมัครสมาชิกสำเร็จ" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}