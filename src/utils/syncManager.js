import { db } from './db.js';

const CHUNK_SIZE = 10;
let isSyncing = false;
let isVocabSyncing = false;
let isUserSyncing = false; // 🛡️ เพิ่ม Flag แยกการทำงานป้องกันคิวชนกัน

export const syncManager = {
  async addToQueue(payload) {
    const queueStr = localStorage.getItem('bw_syncQueue');
    const queue = queueStr ? JSON.parse(queueStr) : [];
    
    const sessionId = payload.reflectionData?.id;
    const exists = queue.find(item => item.reflectionData?.id === sessionId);
    
    if (!exists) {
      queue.push(payload);
      localStorage.setItem('bw_syncQueue', JSON.stringify(queue));
    }
    
    this.triggerSync();
  },

  async triggerSync() {
    if (isSyncing || !navigator.onLine) return;
    
    try {
      isSyncing = true;
      const queueStr = localStorage.getItem('bw_syncQueue');
      let queue = queueStr ? JSON.parse(queueStr) : [];
      
      if (queue.length === 0) return;

      const chunk = queue.slice(0, CHUNK_SIZE);
      
      const response = await fetch('/api/history/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: chunk })
      });

      if (response.ok) {
        const result = await response.json();
        const successIds = result.successIds || chunk.map(p => p.reflectionData.id);
        
        const freshQueueStr = localStorage.getItem('bw_syncQueue');
        queue = freshQueueStr ? JSON.parse(freshQueueStr) : [];
        queue = queue.filter(item => !successIds.includes(item.reflectionData.id));
        
        localStorage.setItem('bw_syncQueue', JSON.stringify(queue));
        
        if (queue.length > 0) {
          setTimeout(() => this.triggerSync(), 2000);
        }
      } else {
        isSyncing = false;
      }
    } catch (err) {
      console.warn("Sync suspended:", err.message);
    } finally {
      isSyncing = false;
    }
  },

  flushWithBeacon() {
    const queueStr = localStorage.getItem('bw_syncQueue');
    const queue = queueStr ? JSON.parse(queueStr) : [];
    if (queue.length > 0) {
      const chunk = queue.slice(0, CHUNK_SIZE);
      const blob = new Blob([JSON.stringify({ data: chunk, isBeacon: true })], { type: 'application/json' });
      navigator.sendBeacon('/api/history/bulk', blob);
    }
  }
  ,

  async triggerVocabSync(userId) {
    if (isVocabSyncing || !navigator.onLine || !userId) return;
    
    try {
      isVocabSyncing = true;
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
            setTimeout(() => this.triggerVocabSync(userId), 2000);
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
        const blob = new Blob([JSON.stringify({ userId, updates: chunk })], { type: 'application/json' });
        navigator.sendBeacon('/api/vocab/srs-sync', blob);
      }
    } catch (err) {
      console.warn("Beacon flush failed", err);
    }
  }
  ,
  // 🛡️ ระบบคิวสำหรับ User Preferences (เช่น การกดดาว) ทนทานต่อสถานะ Offline
  async queueUserAction(actionPayload) {
    const queueStr = localStorage.getItem('bw_userSyncQueue');
    const queue = queueStr ? JSON.parse(queueStr) : [];
    queue.push(actionPayload);
    localStorage.setItem('bw_userSyncQueue', JSON.stringify(queue));
    this.triggerUserSync();
  },

  async triggerUserSync() {
    if (isUserSyncing || !navigator.onLine) return;
    try {
      isUserSyncing = true;
      const queueStr = localStorage.getItem('bw_userSyncQueue');
      let queue = queueStr ? JSON.parse(queueStr) : [];
      if (queue.length === 0) return;

      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncActions: queue })
      });

      if (response.ok) {
        // เคลียร์เฉพาะข้อมูลชุดที่ส่งสำเร็จ (Slice) ป้องกันเหตุการณ์ผู้ใช้กดดาวเพิ่มจังหวะกำลังส่ง
        const freshQueueStr = localStorage.getItem('bw_userSyncQueue');
        const freshQueue = freshQueueStr ? JSON.parse(freshQueueStr) : [];
        const remainingQueue = freshQueue.slice(queue.length); 
        localStorage.setItem('bw_userSyncQueue', JSON.stringify(remainingQueue));
        
        if (remainingQueue.length > 0) setTimeout(() => this.triggerUserSync(), 2000);
      }
    } catch (err) {
      console.warn("User sync suspended:", err.message);
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
          setTimeout(() => syncManager.triggerVocabSync(uid), 500);
        }
      }
    } catch (e) {
      console.warn("Online event sync failed:", e);
    }
  });
}
