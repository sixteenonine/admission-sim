import Dexie from 'dexie';

export const db = new Dexie('BearWithYouDB');

// เปลี่ยนเป็น version(5) เพิ่มตาราง app_state ใช้เก็บ State หลักแบบ Non-blocking
db.version(5).stores({
  flashcards: '++id, eng, category, isStarred, sort_order',
  favorites: 'storyId, title, addedAt',
  vocab_srs: 'eng, next_review, ease_factor, interval, repetition',
  app_state: 'key' 
});