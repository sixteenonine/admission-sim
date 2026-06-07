export async function onRequestGet(context) {
  try {
    const kvData = await context.env.APP_KV.get('vocab_decks', 'json');
    
    if (!kvData) {
      return new Response(JSON.stringify({ error: 'KV is empty. Please run sync first.' }), { status: 404 });
    }

    return new Response(JSON.stringify({ status: 'success', data: kvData }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}