import Dexie from 'dexie';

export const db = new Dexie('BearWithYouDB');

db.version(1).stores({
  flashcards: '++id, vocabId, eng, thai, level, storyId',
  favorites: 'storyId, title, addedAt'
});