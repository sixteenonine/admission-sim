export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { sheetUrl } = payload;
    
    if (!sheetUrl) return new Response(JSON.stringify({ status: "error", message: "ไม่มีลิงก์ข้อมูล" }), { status: 400 });

    const res = await fetch(sheetUrl);
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error('ไม่พบข้อมูลคำศัพท์');

    const headers = lines[0].toLowerCase().split('\t').map(h => h.trim());
    const idx = {
      eng: headers.indexOf('eng'), thai: headers.indexOf('thai'),
      pos: headers.indexOf('pos'), category: headers.indexOf('category'),
      example: headers.indexOf('example'), syn: headers.indexOf('synonyms'), ant: headers.indexOf('antonyms')
    };

    if (idx.eng === -1) throw new Error("ไม่พบคอลัมน์ 'eng'");

    const allWords = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      const eng = cols[idx.eng]?.trim();
      if (!eng) continue;
      allWords.push({
        eng, 
      thai: cols[idx.thai] ? cols[idx.thai].trim() : null,
      pos: cols[idx.pos] ? cols[idx.pos].trim() : null,
      category: cols[idx.category] ? cols[idx.category].trim() : null,
      example: cols[idx.example] ? cols[idx.example].trim() : null,
      synonyms: cols[idx.syn] ? cols[idx.syn].trim() : null,
      antonyms: cols[idx.ant] ? cols[idx.ant].trim() : null,
      sort_order: i
      });
    }

    return new Response(JSON.stringify({ status: "success", data: allWords }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}