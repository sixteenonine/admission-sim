export async function onRequestGet(context) {
  try {
    const db = context.env.DB;
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

    for (const cat in grouped) {
      if (decksTemplate[cat]) {
        const words = grouped[cat];
        const chunkSize = Math.ceil(words.length / 3);
        
        for (let i = 0; i < 3; i++) {
          decksTemplate[cat].levels[i] = words.slice(i * chunkSize, (i + 1) * chunkSize);
        }
      }
    }

    return new Response(JSON.stringify({ status: 'success', data: decksTemplate }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}