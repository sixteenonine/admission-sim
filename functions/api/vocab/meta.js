export async function onRequestGet(context) {
  try {
    let version = "0";
    let counts = null;
    if (context.env.APP_KV) {
      version = await context.env.APP_KV.get('vocab_version') || "0";
      counts = await context.env.APP_KV.get('vocab_counts', 'json');
    }
    
    return new Response(JSON.stringify({ status: 'success', version, counts }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500 });
  }
}