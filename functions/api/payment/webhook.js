export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const event = await context.request.json();

    if (event.key === "charge.complete") {
      const webhookChargeId = event.data?.id;
      if (!webhookChargeId) return new Response(JSON.stringify({ status: "ignored" }), { status: 200 });

      // 🛡️ Enterprise Fix 3: ดึงสถานะจริงจาก Omise โดยตรง (Zero-Trust) ป้องกันแฮกเกอร์ยิง Webhook ปลอม
      const secretKey = context.env.OMISE_SECRET_KEY;
      const encodedKey = btoa(secretKey + ":");
      const verifyRes = await fetch(`https://api.omise.co/charges/${webhookChargeId}`, {
        headers: { "Authorization": `Basic ${encodedKey}` }
      });
      const charge = await verifyRes.json();

      if (charge.status === "successful") {
        const chargeId = charge.id;

        const payment = await db.prepare("SELECT * FROM payments WHERE id = ?").bind(chargeId).first();
        if (payment && payment.status === 'pending') {
          await db.prepare("UPDATE payments SET status = 'successful' WHERE id = ?").bind(chargeId).run();

          let daysToAdd = 30;
          if (payment.plan_tier === 'pro') daysToAdd = 90;
          if (payment.plan_tier === 'premium') daysToAdd = 365;

          await db.prepare(`
            UPDATE users
            SET plan_tier = ?,
                plan_expire_at = datetime('now', '+' || ? || ' days')
            WHERE id = ?
          `).bind(payment.plan_tier, daysToAdd.toString(), payment.user_id).run();
        }
        // บังคับลบแคชทันทีที่จ่ายเงินสำเร็จ เพื่อให้สถานะ Premium อัปเดตแบบเรียลไทม์
        context.waitUntil(context.env.APP_KV.delete(`user_profile_${payment.user_id}`));
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}