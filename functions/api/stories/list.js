export async function onRequestGet(context) {
  try {
    const db = context.env.DB;
    // โหลดเฉพาะ Meta เหมือนเดิม แต่แนบ status มาด้วย
    const { results } = await db.prepare(`
      SELECT id, title, image_url, is_premium, type, status 
      FROM stories 
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify({ status: "success", stories: results }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}