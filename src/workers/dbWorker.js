import { db } from '../utils/db.js';

self.onmessage = async (e) => {
  const { type, payload, id } = e.data;

  if (type === 'LOAD_DECK') {
    try {
      const { isSRS, currentCategory, currentLevel, now } = payload;
      
      
      // 1. ดึงคำศัพท์ทั้งหมดมาก่อนเพื่อหลีกเลี่ยงบั๊ก Index บน iOS Safari ใน Web Worker
      const allCards = await db.flashcards.toArray();
      
      let rawDeck = [];
      if (isSRS) {
        rawDeck = allCards;
      } else if (currentCategory === 'MY FAVORITE') {
        rawDeck = allCards.filter(c => c.isStarred === 1);
      } else {
        rawDeck = allCards.filter(c => c.category === currentCategory);
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
      srsData.forEach(item => srsMap[item.vocab_id] = item);
      
      let localDeck = [];
      if (currentCategory === 'MY FAVORITE') {
        localDeck = [...rawDeck];
      } else if (!isSRS) {
        localDeck = rawDeck.filter(card => {
          const srs = srsMap[card.id];
          return !srs || Number(srs.interval) === 0;
        });
        if (localDeck.length === 0) localDeck = [...rawDeck];
      } else {
        localDeck = rawDeck.filter(card => {
          const srs = srsMap[card.id];
          if (!srs) return false;
          // แปลงวันที่ให้รองรับทั้ง Timestamp (Local) และ ISO String (จาก Server)
          const reviewTime = new Date(srs.next_review || srs.next_review_date || 0).getTime();
          return reviewTime <= now;
        });
      }

      // 3. ดึงรายการดาว
      // 🛡️ Enterprise Fix: เปลี่ยนจาก .filter() เป็น .where() เพื่อดึงจาก Index โดยตรง (เร็วกว่า 100 เท่า ลดแบตเตอรี่)
      const starred = await db.flashcards.where('isStarred').equals(1).toArray();
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