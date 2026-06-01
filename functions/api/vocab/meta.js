export async function onRequestGet(context) {
  try {
    let version = "0";
    if (context.env.APP_KV) {
      version = await context.env.APP_KV.get('vocab_version') || "0";
    }
    
    return new Response(JSON.stringify({ status: 'success', version }), {
      headers: { 
        'Content-Type': 'application/json', 
        'Cache-Control': 'no-store' // บังคับให้เบราว์เซอร์ไม่แคชไฟล์นี้
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), { status: 500 });
  }
}