export async function onRequestGet(context) {
  try {
    // ดึง userId จาก Middleware ที่ผ่านการตรวจสอบ JWT แล้ว (ปลอดภัย 100%)
    const userId = context.data?.user?.userId;
    if (!userId) return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { status: 401 });

    const db = context.env.DB;
    let data = await context.env.APP_KV.get(`user_sync_${userId}`, "json");
    
    if (!data) {
      data = await db.prepare("SELECT * FROM user_sync_data WHERE user_id = ?").bind(userId).first();
      if (data) context.waitUntil(context.env.APP_KV.put(`user_sync_${userId}`, JSON.stringify(data)));
    }

    return new Response(JSON.stringify({ status: "success", data: data || null }), { 
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-cache" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { favorites, custom_decks, custom_speedreads, syncActions } = payload;
    
    // ดึง userId จาก Middleware แทนการรับจากหน้าบ้านป้องกันการสวมรอย (IDOR)
    const userId = context.data?.user?.userId;
    if (!userId) return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), { status: 401 });

    const db = context.env.DB;
    // 🛡️ Enterprise Feature: Optimistic Concurrency Control ผ่าน KV เพื่อลด D1 Read
    let currentServerData = await context.env.APP_KV.get(`user_sync_${userId}`, "json");
    if (!currentServerData) {
      currentServerData = await db.prepare("SELECT updated_at, favorites, custom_decks, custom_speedreads, srs_progress FROM user_sync_data WHERE user_id = ?").bind(userId).first();
    }
    
    // เช็ค Conflict: ถ้าเวลา Server ใหม่กว่า Client (มีคนใช้อีกอุปกรณ์) จะเตะ HTTP 409 แจ้งให้ดึงข้อมูลก่อน
    if (payload.last_synced_at && currentServerData && currentServerData.updated_at) {
      const serverTime = new Date(currentServerData.updated_at).getTime();
      const clientTime = new Date(payload.last_synced_at).getTime();
      
      if (serverTime - clientTime > 2000) { // เผื่อ Network Delay 2 วินาที
        return new Response(JSON.stringify({ 
          status: "conflict", 
          message: "ตรวจพบการอัปเดตจากอุปกรณ์อื่น กรุณารีเฟรชเพื่อดึงข้อมูลล่าสุด",
          server_data: currentServerData 
        }), { status: 409, headers: { "Content-Type": "application/json" } });
      }
    }

    let finalFavoritesJson = null;

    if (syncActions && Array.isArray(syncActions)) {
      let currentFavs = { stories: [], vocab: [] };
      
      // ดึงของเดิมจาก Server มาทำ Delta Merge แทนการ Query ใหม่เพื่อประหยัด Read Operation
      if (currentServerData && currentServerData.favorites) {
        try { currentFavs = JSON.parse(currentServerData.favorites); } catch (e) {}
      }
      currentFavs.vocab = currentFavs.vocab || [];
      currentFavs.stories = currentFavs.stories || [];
      
      syncActions.sort((a, b) => a.timestamp - b.timestamp);
      for (let action of syncActions) {
        if (action.type === 'star_vocab') {
          if (action.isStarred && !currentFavs.vocab.includes(action.word)) {
            currentFavs.vocab.push(action.word);
          } else if (!action.isStarred) {
            currentFavs.vocab = currentFavs.vocab.filter(w => w !== action.word);
          }
        } else if (action.type === 'star_story') {
          if (action.isStarred && !currentFavs.stories.includes(action.storyId)) {
            currentFavs.stories.push(action.storyId);
          } else if (!action.isStarred) {
            currentFavs.stories = currentFavs.stories.filter(s => s !== action.storyId);
          }
        }
      }
      finalFavoritesJson = JSON.stringify(currentFavs);
    } else if (favorites) {
      finalFavoritesJson = JSON.stringify(favorites);
    }

    const nowIso = new Date().toISOString();
    
    const updatedSyncData = await db.prepare(`
      INSERT INTO user_sync_data (user_id, favorites, custom_decks, custom_speedreads, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
      favorites = COALESCE(excluded.favorites, user_sync_data.favorites),
      custom_decks = COALESCE(excluded.custom_decks, user_sync_data.custom_decks),
      custom_speedreads = COALESCE(excluded.custom_speedreads, user_sync_data.custom_speedreads),
      updated_at = excluded.updated_at
      RETURNING *
    `).bind(
      userId,
      finalFavoritesJson,
      custom_decks ? JSON.stringify(custom_decks) : null,
      custom_speedreads ? JSON.stringify(custom_speedreads) : null,
      nowIso
    ).first();

    if (updatedSyncData) {
      context.waitUntil(context.env.APP_KV.put(`user_sync_${userId}`, JSON.stringify(updatedSyncData)));
    }

    return new Response(JSON.stringify({ status: "success", synced_at: nowIso }), { 
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}