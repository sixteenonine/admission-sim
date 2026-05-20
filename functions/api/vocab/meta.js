export async function onRequestGet(context) {
  try {
    const count = await context.env.DB.prepare("SELECT COUNT(*) as total FROM vocab_repository").first('total');
    return new Response(JSON.stringify({ status: 'success', total: count }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500 });
  }
}