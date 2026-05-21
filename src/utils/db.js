import Dexie from 'dexie';

export const db = new Dexie('BearWithYouDB');

// เปลี่ยนเป็น version(4) เพื่อเพิ่มตาราง vocab_srs รองรับอัลกอริทึม Spaced Repetition
db.version(4).stores({
  flashcards: '++id, eng, category, isStarred, sort_order',
  favorites: 'storyId, title, addedAt',
  vocab_srs: 'eng, next_review, ease_factor, interval, repetition'
});