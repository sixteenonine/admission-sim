export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return new Response(JSON.stringify({ status: "error", message: "Missing userId" }), { status: 400 });

    const db = context.env.DB;
    const data = await db.prepare("SELECT * FROM user_sync_data WHERE user_id = ?").bind(userId).first();

    return new Response(JSON.stringify({ status: "success", data: data || null }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const { userId, favorites, custom_decks, custom_speedreads } = await context.request.json();
    if (!userId) return new Response(JSON.stringify({ status: "error", message: "Missing userId" }), { status: 400 });

    const db = context.env.DB;
    // ใช้ COALESCE เพื่ออัปเดตเฉพาะฟิลด์ที่มีการส่งค่ามา (ไม่กระทบฟิลด์อื่น)
    await db.prepare(`
      INSERT INTO user_sync_data (user_id, favorites, custom_decks, custom_speedreads)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
      favorites = COALESCE(excluded.favorites, user_sync_data.favorites),
      custom_decks = COALESCE(excluded.custom_decks, user_sync_data.custom_decks),
      custom_speedreads = COALESCE(excluded.custom_speedreads, user_sync_data.custom_speedreads),
      updated_at = CURRENT_TIMESTAMP
    `).bind(
      userId,
      favorites ? JSON.stringify(favorites) : null,
      custom_decks ? JSON.stringify(custom_decks) : null,
      custom_speedreads ? JSON.stringify(custom_speedreads) : null
    ).run();

    return new Response(JSON.stringify({ status: "success" }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}