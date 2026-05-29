const CHUNK_SIZE = 10;
let isSyncing = false;

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
        setTimeout(() => { isSyncing = false; this.triggerSync(); }, 10000);
      }
    } catch (err) {
      console.warn("Sync failed, will retry:", err);
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
};