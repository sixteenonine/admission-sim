import { db } from './db';

const CHUNK_SIZE = 10;
let isSyncing = false;

export const syncManager = {
  async addToQueue(payload) {
    const record = await db.app_state.get('syncQueue');
    const queue = record ? record.value : [];
    
    const sessionId = payload.reflectionData?.id;
    const exists = queue.find(item => item.reflectionData?.id === sessionId);
    
    if (!exists) {
      queue.push(payload);
      await db.app_state.put({ key: 'syncQueue', value: queue });
    }
    
    this.triggerSync();
  },

  async triggerSync() {
    if (isSyncing || !navigator.onLine) return;
    
    try {
      isSyncing = true;
      let record = await db.app_state.get('syncQueue');
      let queue = record ? record.value : [];
      
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
        
        record = await db.app_state.get('syncQueue'); 
        queue = record ? record.value : [];
        queue = queue.filter(item => !successIds.includes(item.reflectionData.id));
        
        await db.app_state.put({ key: 'syncQueue', value: queue });
        
        if (queue.length > 0) {
          setTimeout(() => this.triggerSync(), 2000);
        }
      } else {
        setTimeout(() => { isSyncing = false; this.triggerSync(); }, 10000);
      }
    } catch (err) {
      console.warn("Sync failed, will retry:", err);
    } finally {
      isSyncing = false;
    }
  },

  flushWithBeacon() {
    db.app_state.get('syncQueue').then(record => {
      const queue = record ? record.value : [];
      if (queue.length > 0) {
        const chunk = queue.slice(0, CHUNK_SIZE);
        const blob = new Blob([JSON.stringify({ data: chunk, isBeacon: true })], { type: 'application/json' });
        navigator.sendBeacon('/api/history/bulk', blob);
      }
    }).catch(() => {});
  }
};