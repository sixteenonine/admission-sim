export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { username } = await context.request.json();

    if (!username) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอก Username" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    const existingUser = await db.prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1").bind(username).first();
    
    if (existingUser) {
      return new Response(JSON.stringify({ status: "error", message: "Username นี้มีในระบบแล้ว" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ status: "success", message: "Username สามารถใช้งานได้" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: "เกิดข้อผิดพลาดในการตรวจสอบ" }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}