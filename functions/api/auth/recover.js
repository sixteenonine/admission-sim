export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    // action รับค่า "get_question" หรือ "reset_password"
    const { action, username, securityAnswer, newPassword } = await context.request.json();

    if (!username) {
      return new Response(JSON.stringify({ status: "error", message: "กรุณากรอก Username" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // ค้นหาผู้ใช้จาก Username แบบไม่สนตัวพิมพ์เล็กใหญ่
    const user = await db.prepare(
      "SELECT id, security_question_id, security_answer_hash FROM users WHERE LOWER(username) = LOWER(?)"
    ).bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "ไม่พบผู้ใช้งานนี้ในระบบ" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    if (!user.security_question_id) {
      return new Response(JSON.stringify({ status: "error", message: "ผู้ใช้นี้ยังไม่ได้ตั้งคำถามความปลอดภัย ไม่สามารถกู้คืนผ่านระบบได้" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
      });
    }

    // Step 1: ดึงคำถามไปแสดงผลบนหน้าเว็บ
    if (action === "get_question") {
        return new Response(JSON.stringify({ 
          status: "success", 
          securityQuestionId: user.security_question_id 
        }), { headers: { "Content-Type": "application/json" } });
    }
    // Step 1.5: ตรวจคำตอบก่อนให้ตั้งรหัสผ่านใหม่
    if (action === "verify_answer") {
        if (!securityAnswer) {
          return new Response(JSON.stringify({ status: "error", message: "กรุณากรอกคำตอบ" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (user.security_answer_hash.toLowerCase() !== securityAnswer.toLowerCase()) {
            return new Response(JSON.stringify({ status: "error", message: "คำตอบความปลอดภัยไม่ถูกต้อง" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ status: "success", message: "คำตอบถูกต้อง" }), { headers: { "Content-Type": "application/json" } });
    }

    // Step 2: ตรวจคำตอบและเปลี่ยนรหัสผ่าน
    if (action === "reset_password") {
        if (!securityAnswer || !newPassword) {
          return new Response(JSON.stringify({ status: "error", message: "ข้อมูลไม่ครบถ้วน" }), { 
            status: 400, headers: { "Content-Type": "application/json" } 
          });
        }

        if (user.security_answer_hash.toLowerCase() !== securityAnswer.toLowerCase()) {
            return new Response(JSON.stringify({ status: "error", message: "คำตอบความปลอดภัยไม่ถูกต้อง" }), { 
              status: 400, headers: { "Content-Type": "application/json" } 
            });
        }

        await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newPassword, user.id).run();
        
        return new Response(JSON.stringify({ status: "success", message: "เปลี่ยนรหัสผ่านสำเร็จ สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที" }), { 
          headers: { "Content-Type": "application/json" } 
        });
    }

    return new Response(JSON.stringify({ status: "error", message: "คำสั่งไม่ถูกต้อง" }), { 
      status: 400, headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}