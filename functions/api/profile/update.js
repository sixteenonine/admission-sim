export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { userId, currentPassword, newUsername, newPassword, securityQuestionId, securityAnswer } = await context.request.json();

    if (!userId || !currentPassword) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // 1. ตรวจสอบรหัสผ่านปัจจุบัน
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    if (!user || user.password_hash !== currentPassword) {
      return new Response(JSON.stringify({ status: "error", message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    let updates = [];
    let values = [];

    // 2. เช็กและอัปเดต Username
    if (newUsername && newUsername !== user.username) {
       const existing = await db.prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?").bind(newUsername, userId).first();
       if (existing) {
         return new Response(JSON.stringify({ status: "error", message: "Username นี้มีผู้ใช้งานแล้ว" }), { 
           status: 400, headers: { "Content-Type": "application/json" } 
         });
       }
       updates.push("username = ?");
       values.push(newUsername);
    }

    // 3. เช็กและอัปเดต Password
    if (newPassword) {
       updates.push("password_hash = ?");
       values.push(newPassword);
    }

    // 4. เช็กและอัปเดตคำถามความปลอดภัย
    if (securityQuestionId && securityAnswer) {
       updates.push("security_question_id = ?");
       values.push(securityQuestionId);
       updates.push("security_answer_hash = ?");
       values.push(securityAnswer);
    }

    // 5. บันทึกลงฐานข้อมูล
    if (updates.length > 0) {
       values.push(userId);
       const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
       await db.prepare(query).bind(...values).run();
       return new Response(JSON.stringify({ status: "success", message: "อัปเดตข้อมูลสำเร็จ" }), {
         headers: { "Content-Type": "application/json" }
       });
    }

    return new Response(JSON.stringify({ status: "success", message: "ไม่มีข้อมูลเปลี่ยนแปลง" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}