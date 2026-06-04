export async function onRequestPost(context) {
  try {
    const db = context.env.DB;
    const kv = context.env.APP_KV;
    
    const { results } = await db.prepare("SELECT * FROM vocab_repository WHERE is_deleted = 0 ORDER BY sort_order ASC").all();
    
    const decksTemplate = {
      "SCIENCE, HEALTH & NATURE": { color: "green", levels: [[], [], []] },
      "BUSINESS & TECHNOLOGIES": { color: "#0070fb", levels: [[], [], []] },
      "ACADEMIC & CAREER": { color: "#ff2e57", levels: [[], [], []] },
      "LIFESTYLE & MEDIA": { color: "#8c52ff", levels: [[], [], []] },
      "SOCIETY & CULTURE": { color: "#505e72", levels: [[], [], []] },
      "MY FAVORITE": { color: "#ff8301", levels: [[], [], []] }
    };

    const grouped = {};
    results.forEach(vocab => {
      const cat = (vocab.category || "UNCATEGORIZED").toUpperCase();
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(vocab);
    });

    const counts = {};

    const missingCategories = [];

    for (const cat in grouped) {
      if (decksTemplate[cat]) {
        const words = grouped[cat];
        const chunkSize = Math.ceil(words.length / 3);
        
        counts[cat] = { total: words.length, levels: [0, 0, 0] };

        for (let i = 0; i < 3; i++) {
          const slice = words.slice(i * chunkSize, (i + 1) * chunkSize);
          const leveledSlice = slice.map(w => ({ ...w, level: i + 1 }));
          decksTemplate[cat].levels[i] = leveledSlice;
          counts[cat].levels[i] = leveledSlice.length;
        }
      } else if (cat !== "UNCATEGORIZED") {
        missingCategories.push(cat); // 🛡️ ดักจับหมวดหมู่ขยะหรือพิมพ์ผิด
      }
    }

    const version = Date.now().toString();

    await Promise.all([
      kv.put('vocab_decks', JSON.stringify(decksTemplate)),
      kv.put('vocab_counts', JSON.stringify(counts)),
      kv.put('vocab_version', version)
    ]);

    let message = 'Synced D1 to KV successfully';
    if (missingCategories.length > 0) {
      message += ` | ⚠️ WARNING: Ignored unknown categories: [${missingCategories.join(', ')}] Please check spelling in Google Sheet!`;
    }

    return new Response(JSON.stringify({ status: 'success', version, message }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}