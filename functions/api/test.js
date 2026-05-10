export async function onRequest(context) {
  try {
    // ดึง Binding ของ D1 Database ที่เราตั้งชื่อไว้ว่า DB ในไฟล์ wrangler.jsonc
    const db = context.env.DB;
    
    // ทดลอง Query ข้อมูลจากตาราง users
    const { results } = await db.prepare("SELECT * FROM users").all();
    
    return new Response(JSON.stringify({ 
      status: "success", 
      message: "Database connected successfully!", 
      data: results 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      status: "error", 
      message: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}