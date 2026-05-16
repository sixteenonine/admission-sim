export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const { userId, amount, planTier } = await context.request.json();

    const secretKey = "skey_test_67p1p3wtpd69lacepjz";
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