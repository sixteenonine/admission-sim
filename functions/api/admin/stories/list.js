export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(`
      SELECT id, title, image_url, is_premium, type, status 
      FROM stories 
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify({ status: "success", stories: results }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate" 
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}