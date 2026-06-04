import { db } from './db.js';

const CHUNK_SIZE = 10;
let isSyncing = false;
let isVocabSyncing = false;
let isUserSyncing = false; // 🛡️ เพิ่ม Flag แยกการทำงานป้องกันคิวชนกัน
let vocabSyncTimer = null; // 🛡️ ตัวแปรเก็บเวลาหน่วงสำหรับ Smart Batching
let historyRetryDelay = 2000;
let userRetryDelay = 2000;

export const syncManager = {
  async addToQueue(payload) {
    const sessionId = payload.reflectionData?.id;
    if (sessionId) {
      await db.history_queue.put({ sessionId, payload });
      this.triggerSync();
    }
  },

  async triggerSync() {
    if (isSyncing || !navigator.onLine) return;
    try {
      isSyncing = true;
      const queue = await db.history_queue.toArray();
      if (queue.length === 0) {
        historyRetryDelay = 2000;
        return;
      }

      const chunk = queue.slice(0, CHUNK_SIZE).map(q => q.payload);
      const response = await fetch('/api/history/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: chunk })
      });

      if (response.ok) {
        const result = await response.json();
        const successIds = result.successIds || chunk.map(p => p.reflectionData.id);
        await db.history_queue.bulkDelete(successIds);
        historyRetryDelay = 2000;
        if (queue.length > chunk.length) {
          setTimeout(() => this.triggerSync(), 2000);
        }
      } else {
        throw new Error('Sync API rejected');
      }
    } catch (err) {
      console.warn("Sync suspended:", err.message);
      historyRetryDelay = Math.min(historyRetryDelay * 2, 60000);
      setTimeout(() => this.triggerSync(), historyRetryDelay);
    } finally {
      isSyncing = false;
    }
  },

  async flushWithBeacon() {
    try {
      const queue = await db.history_queue.toArray();
      if (queue.length > 0) {
        const chunk = queue.slice(0, CHUNK_SIZE).map(q => q.payload);
        const blob = new Blob([JSON.stringify({ data: chunk, isBeacon: true })], { type: 'application/json' });
        navigator.sendBeacon('/api/history/bulk', blob);
      }
    } catch(e) {}
  },

  async triggerVocabSync(userId, force = false) {
    if (!navigator.onLine || !userId) return;

    // 🛡️ Enterprise Feature: Smart Batching & Debounce (หน่วงเวลายิง API และรองรับ Undo 100%)
    if (!force) {
      const count = await db.sync_outbox.where('user_id').equals(userId).count();
      if (count < 50) { // 🛡️ ขยาย Batch เป็น 50 คำ ลดภาระ Network
        if (vocabSyncTimer) clearTimeout(vocabSyncTimer);
        vocabSyncTimer = setTimeout(() => this.triggerVocabSync(userId, true), 30000); // 🛡️ หน่วงเวลาเป็น 30 วินาที
        return;
      }
    }

    if (isVocabSyncing) return;
    try {
      isVocabSyncing = true;
      if (vocabSyncTimer) clearTimeout(vocabSyncTimer);

      const outboxItems = await db.sync_outbox.where('user_id').equals(userId).toArray();
      if (outboxItems.length === 0) return;
      const chunk = outboxItems.slice(0, 50);

      if (chunk.length > 0) {
        const response = await fetch('/api/vocab/srs-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, updates: chunk })
        });

        if (response.ok) {
          const itemIds = chunk.map(item => item.id);
          await db.sync_outbox.bulkDelete(itemIds);
          if (outboxItems.length > 50) {
            setTimeout(() => this.triggerVocabSync(userId, true), 2000);
          }
        } else {
          isVocabSyncing = false;
        }
      }
    } catch (err) {
      console.warn("Vocab sync suspended:", err.message);
    } finally {
      isVocabSyncing = false;
    }
  },

  async flushVocabWithBeacon(userId) {
    if (!userId) return;
    try {
      const outboxItems = await db.sync_outbox.where('user_id').equals(userId).toArray();
      if (outboxItems.length === 0) return;
      const chunk = outboxItems.slice(0, 50);
      
      if (chunk.length > 0) {
        // 🛡️ Enterprise Fix: เปลี่ยนจาก sendBeacon เป็น fetch + keepalive เพื่อให้รอรับผลลัพธ์และลบขยะทิ้งได้ทันก่อนปิดแท็บ
        const response = await fetch('/api/vocab/srs-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, updates: chunk }),
          keepalive: true 
        });
        
        if (response.ok) {
          const itemIds = chunk.map(item => item.id);
          await db.sync_outbox.bulkDelete(itemIds);
        }
      }
    } catch (err) {
      console.warn("Beacon flush failed", err);
    }
  },

  // 🛡️ ระบบคิวสำหรับ User Preferences (เช่น การกดดาว) ทนทานต่อสถานะ Offline
  async queueUserAction(actionPayload) {
    await db.user_sync_queue.add({ actionPayload });
    this.triggerUserSync();
  },

  async triggerUserSync() {
    if (isUserSyncing || !navigator.onLine) return;
    try {
      isUserSyncing = true;
      const queue = await db.user_sync_queue.toArray();
      if (queue.length === 0) {
        userRetryDelay = 2000;
        return;
      }

      const actions = queue.map(q => q.actionPayload);
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncActions: actions })
      });

      if (response.ok) {
        const idsToDelete = queue.map(q => q.id);
        await db.user_sync_queue.bulkDelete(idsToDelete);
        userRetryDelay = 2000;
        const remaining = await db.user_sync_queue.count();
        if (remaining > 0) setTimeout(() => this.triggerUserSync(), 2000);
      } else {
        throw new Error('User sync API rejected');
      }
    } catch (err) {
      console.warn("User sync suspended:", err.message);
      userRetryDelay = Math.min(userRetryDelay * 2, 60000);
      setTimeout(() => this.triggerUserSync(), userRetryDelay);
    } finally {
      isUserSyncing = false;
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    try {
      syncManager.triggerSync();
      syncManager.triggerUserSync(); // 🛡️ บังคับระบายคิวกดดาวทันทีเมื่อเน็ตกลับมาเชื่อมต่อ
      
      // 🛡️ Enterprise Fix: รวมการซิงก์ศัพท์ทั้งหมดเป็นก้อนเดียว ลดภาระ Network 100%
      const allOutbox = await db.sync_outbox.toArray();
      if (allOutbox.length > 0) {
        const grouped = allOutbox.reduce((acc, item) => {
          if (!acc[item.user_id]) acc[item.user_id] = [];
          acc[item.user_id].push(item);
          return acc;
        }, {});

        for (const [uid, items] of Object.entries(grouped)) {
          setTimeout(() => syncManager.triggerVocabSync(uid, true), 500); // 🛡️ บังคับระบายคิว
        }
      }
    } catch (e) {
      console.warn("Online event sync failed:", e);
    }
  });
}