export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { userId, planTier } = await context.request.json();

    // 🛡️ Enterprise Fix 1: ป้องกันการแก้ราคา (Price Spoofing) กำหนดราคาที่ฝั่งเซิร์ฟเวอร์เท่านั้น
    // คุณสามารถเปลี่ยนตัวเลข 149 และ 990 ให้ตรงกับราคาจริงที่คุณตั้งใจขายได้เลย
    const PLAN_PRICES = { 'pro': 149, 'premium': 990 }; 
    const amount = PLAN_PRICES[planTier];
    
    if (!amount) {
      return new Response(JSON.stringify({ status: "error", message: "แพ็กเกจไม่ถูกต้อง" }), { status: 400 });
    }

    // 🛡️ Enterprise Fix 2: ห้าม Hardcode Secret Key ต้องดึงจาก Cloudflare Secrets (Environment)
    const secretKey = context.env.OMISE_SECRET_KEY;
    if (!secretKey) throw new Error("Payment gateway is not configured properly.");
    const encodedKey = btoa(secretKey + ":");

    const chargeRes = await fetch("https://api.omise.co/charges", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${encodedKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount * 100, 
        currency: "thb",
        source: { type: "promptpay" }
      })
    });

    const charge = await chargeRes.json();

    if (charge.error) {
      return new Response(JSON.stringify({ status: "error", message: charge.error.message }), { status: 400 });
    }

    await db.prepare(
      "INSERT INTO payments (id, user_id, amount, plan_tier, status) VALUES (?, ?, ?, ?, ?)"
    ).bind(charge.id, userId, amount, planTier, 'pending').run();

    const qrPayload = charge.source.scannable_code.image.download_uri;

    return new Response(JSON.stringify({
      status: "success",
      chargeId: charge.id,
      qrImage: qrPayload
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}