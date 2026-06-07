export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const lastSync = url.searchParams.get('lastSync');
    
    // 1. ดึงข้อมูลดิบทั้งหมดจาก KV ก่อน (Zero-D1-Read)
    let kvVocab = await context.env.APP_KV.get("vocab_full_list", "json");
    let serverTime = await context.env.APP_KV.get("vocab_server_time");

    // Fallback: กรณี KV ว่างเปล่า ให้ดึงจาก D1 ครั้งเดียวแล้วเซฟลง KV
    if (!kvVocab) {
      const db = context.env.DB;
      const { results } = await db.prepare("SELECT * FROM vocab_repository").all();
      const timeRes = await db.prepare("SELECT CURRENT_TIMESTAMP as server_time").first();
      
      kvVocab = results;
      serverTime = timeRes.server_time;

      context.waitUntil(context.env.APP_KV.put("vocab_full_list", JSON.stringify(kvVocab)));
      context.waitUntil(context.env.APP_KV.put("vocab_server_time", serverTime));
    }

    // 2. กรองข้อมูลในหน่วยความจำ (Worker Memory) แทนการใช้ SQL WHERE
    let responseData = kvVocab;
    if (lastSync) {
       responseData = kvVocab.filter(word => word.updated_at > lastSync);
    } else {
       responseData = kvVocab.filter(word => word.is_deleted === 0);
    }

    const activeTotal = kvVocab.filter(word => word.is_deleted === 0).length;

    return new Response(JSON.stringify({ 
      status: 'success', 
      data: responseData,
      total: activeTotal,
      serverTime: serverTime || new Date().toISOString()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', message: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}