import Dexie from 'dexie';

export const db = new Dexie('BearWithYouDB');

// เปลี่ยนเป็น version(2) เพื่อบังคับให้เบราว์เซอร์อัปเดตโครงสร้างฐานข้อมูลใหม่
db.version(2).stores({
  flashcards: '++id, eng, category, isStarred',
  favorites: 'storyId, title, addedAt'
});