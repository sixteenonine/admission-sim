import Dexie from 'dexie';

export const db = new Dexie('BearWithYouDB');

// เปลี่ยนเป็น version(6) ถอด app_state ออกไปใช้ Zustand แทน
db.version(6).stores({
  flashcards: '++id, eng, category, isStarred, sort_order',
  favorites: 'storyId, title, addedAt',
  vocab_srs: 'eng, next_review, ease_factor, interval, repetition'
});