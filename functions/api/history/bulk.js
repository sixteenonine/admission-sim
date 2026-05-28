export async function onRequestPost(context) {
  try {
    const { data, isBeacon } = await context.request.json();
    const userId = context.data?.user?.userId;

    if (!userId) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { 
        status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
      });
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return new Response(JSON.stringify({ status: "error", message: "ข้อมูลไม่ถูกต้องหรือว่างเปล่า" }), { 
        status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
      });
    }

    // แปลงข้อมูลให้อยู่ในฟอร์แมตที่ Cloudflare Queue sendBatch ต้องการ
    const messages = data.map(item => ({
      body: {
        historyId: item.reflectionData?.id || crypto.randomUUID(),
        userId: userId, 
        mode: item.mode || "full",
        score: item.score || 0,
        reflectionData: item.reflectionData
      }
    }));

    // ส่งเข้าคิวทีเดียวทั้งก้อน (ลดภาระ I/O)
    await context.env.HISTORY_QUEUE.sendBatch(messages);

    // ดึง ID ออกมาส่งกลับให้ Frontend
    const successIds = data.map(item => item.reflectionData?.id).filter(Boolean);

    return new Response(JSON.stringify({ status: "success", successIds }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
    });
  }
}