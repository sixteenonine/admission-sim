export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const lastSync = url.searchParams.get('lastSync');
    const db = context.env.DB;

    let query = "SELECT * FROM vocab_repository";
    let params = [];

    if (lastSync) {
      query += " WHERE updated_at > ?";
      params.push(lastSync);
    }

    const { results } = await db.prepare(query).bind(...params).all();
    const timeRes = await db.prepare("SELECT CURRENT_TIMESTAMP as server_time").first();

    const countRes = await db.prepare("SELECT COUNT(*) as total FROM vocab_repository").first();

    return new Response(JSON.stringify({ 
      status: 'success', 
      data: results,
      total: countRes.total,
      serverTime: timeRes.server_time
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}