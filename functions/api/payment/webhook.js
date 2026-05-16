export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const event = await context.request.json();

    if (event.key === "charge.complete") {
      const charge = event.data;
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
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}