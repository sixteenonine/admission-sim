import { db } from '../utils/db.js';

self.onmessage = async (e) => {
  const { type, payload, id } = e.data;

  if (type === 'LOAD_DECK') {
    try {
      const { isSRS, currentCategory, currentLevel, now } = payload;
      
      // 1. ดึงคำศัพท์ตามหมวดหมู่
      let rawDeck = [];
      if (isSRS) {
        rawDeck = await db.flashcards.toArray();
      } else if (currentCategory === 'MY FAVORITE') {
        rawDeck = await db.flashcards.where('isStarred').equals(1).toArray();
      } else {
        rawDeck = await db.flashcards.where('category').equals(currentCategory).toArray();
      }
      
      // เรียงตาม sort_order
      rawDeck.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      // ตัดแบ่งส่วน (Chunking 3 ระดับ)
      if (!isSRS && currentCategory !== 'MY FAVORITE' && rawDeck.length > 0) {
        const chunkSize = Math.ceil(rawDeck.length / 3);
        const idx = currentLevel - 1;
        rawDeck = rawDeck.slice(idx * chunkSize, (idx + 1) * chunkSize);
      }

      // 2. ดึงข้อมูล SRS เพื่อกรอง
      const srsData = await db.vocab_srs.toArray();
      const srsMap = {};
      srsData.forEach(item => srsMap[item.eng] = item);
      
      let localDeck = [];
      if (currentCategory === 'MY FAVORITE') {
        localDeck = [...rawDeck];
      } else if (!isSRS) {
        localDeck = rawDeck.filter(card => {
          const srs = srsMap[card.eng];
          return !srs || srs.interval === 0;
        });
        if (localDeck.length === 0) localDeck = [...rawDeck];
      } else {
        localDeck = rawDeck.filter(card => {
          const srs = srsMap[card.eng];
          return srs && srs.next_review <= now;
        });
      }

      // 3. ดึงรายการดาว
      const starred = await db.flashcards.filter(word => word.isStarred === 1).toArray();
      const starredWords = starred.map(w => w.eng);

      self.postMessage({ 
        id, 
        status: 'success', 
        data: { deck: localDeck, rawDeckSize: localDeck.length, starredWords } 
      });
    } catch (error) {
      self.postMessage({ id, status: 'error', error: error.message });
    }
  }
};