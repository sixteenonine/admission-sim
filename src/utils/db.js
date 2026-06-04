import Dexie from 'dexie';

export const db = new Dexie('BearWithYouDB');

db.version(10).stores({
  flashcards: 'id, eng, category, isStarred, sort_order',
  favorites: 'storyId, title, addedAt',
  vocab_srs: 'vocab_id, eng, next_review, ease_factor, interval, repetition, revision',
  sync_outbox: 'id, user_id, vocab_id, action, timestamp',
  history_queue: 'sessionId, payload',
  user_sync_queue: '++id, actionPayload'
});