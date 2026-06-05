export async function onRequestGet(context) {
  try {
    const kvData = await context.env.APP_KV.get('stories_list') || JSON.stringify({ status: "success", stories: [] });

    return new Response(kvData, {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}