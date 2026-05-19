export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return new Response(JSON.stringify({ status: "error", message: "Missing userId" }), { status: 400 });

    const db = context.env.DB;
    const data = await db.prepare("SELECT * FROM user_sync_data WHERE user_id = ?").bind(userId).first();

    return new Response(JSON.stringify({ status: "success", data: data || null }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { userId, favorites, custom_decks, custom_speedreads, syncActions } = payload;
    if (!userId) return new Response(JSON.stringify({ status: "error", message: "Missing userId" }), { status: 400 });

    const db = context.env.DB;
    let finalFavoritesJson = null;

    if (syncActions && Array.isArray(syncActions)) {
      const existingData = await db.prepare("SELECT favorites FROM user_sync_data WHERE user_id = ?").bind(userId).first();
      let currentFavs = { stories: [], vocab: [] };
      
      if (existingData && existingData.favorites) {
        try { currentFavs = JSON.parse(existingData.favorites); } catch (e) {}
      }
      currentFavs.vocab = currentFavs.vocab || [];
      
      syncActions.sort((a, b) => a.timestamp - b.timestamp);
      for (let action of syncActions) {
        if (action.type === 'star_vocab') {
          if (action.isStarred && !currentFavs.vocab.includes(action.word)) {
            currentFavs.vocab.push(action.word);
          } else if (!action.isStarred) {
            currentFavs.vocab = currentFavs.vocab.filter(w => w !== action.word);
          }
        }
      }
      finalFavoritesJson = JSON.stringify(currentFavs);
    } else if (favorites) {
      finalFavoritesJson = JSON.stringify(favorites);
    }

    await db.prepare(`
      INSERT INTO user_sync_data (user_id, favorites, custom_decks, custom_speedreads)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
      favorites = COALESCE(excluded.favorites, user_sync_data.favorites),
      custom_decks = COALESCE(excluded.custom_decks, user_sync_data.custom_decks),
      custom_speedreads = COALESCE(excluded.custom_speedreads, user_sync_data.custom_speedreads),
      updated_at = CURRENT_TIMESTAMP
    `).bind(
      userId,
      finalFavoritesJson,
      custom_decks ? JSON.stringify(custom_decks) : null,
      custom_speedreads ? JSON.stringify(custom_speedreads) : null
    ).run();

    return new Response(JSON.stringify({ status: "success" }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}
export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { userId, favorites, custom_decks, custom_speedreads, syncActions } = payload;
    if (!userId) return new Response(JSON.stringify({ status: "error", message: "Missing userId" }), { status: 400 });

    const db = context.env.DB;
    let finalFavoritesJson = null;

    if (syncActions && Array.isArray(syncActions)) {
      const existingData = await db.prepare("SELECT favorites FROM user_sync_data WHERE user_id = ?").bind(userId).first();
      let currentFavs = { stories: [], vocab: [] };
      
      if (existingData && existingData.favorites) {
        try { currentFavs = JSON.parse(existingData.favorites); } catch (e) {}
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

    await db.prepare(`
      INSERT INTO user_sync_data (user_id, favorites, custom_decks, custom_speedreads)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
      favorites = COALESCE(excluded.favorites, user_sync_data.favorites),
      custom_decks = COALESCE(excluded.custom_decks, user_sync_data.custom_decks),
      custom_speedreads = COALESCE(excluded.custom_speedreads, user_sync_data.custom_speedreads),
      updated_at = CURRENT_TIMESTAMP
    `).bind(
      userId,
      finalFavoritesJson,
      custom_decks ? JSON.stringify(custom_decks) : null,
      custom_speedreads ? JSON.stringify(custom_speedreads) : null
    ).run();

    return new Response(JSON.stringify({ status: "success" }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
  }
}