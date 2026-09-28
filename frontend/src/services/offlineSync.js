// src/services/offlineSync.js
// Offline data sync queue — stores pending test results locally and syncs when online

const SYNC_QUEUE_KEY = 'feedsense_sync_queue';
const OFFLINE_RESULTS_KEY = 'feedsense_offline_results';

class OfflineSyncService {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this._setupListeners();
  }

  _setupListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncAll();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Add a pending action to the queue
  addToQueue(action) {
    const queue = this.getQueue();
    queue.push({
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...action
    });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return queue.length;
  }

  // Get current sync queue
  getQueue() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  // Save offline test result
  saveOfflineResult(result) {
    const results = this.getOfflineResults();
    results.push({
      ...result,
      savedAt: new Date().toISOString(),
      synced: false
    });
    localStorage.setItem(OFFLINE_RESULTS_KEY, JSON.stringify(results));
  }

  // Get offline results
  getOfflineResults() {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_RESULTS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  // Sync all pending items when back online
  async syncAll() {
    if (!this.isOnline) return { synced: 0, failed: 0 };

    const queue = this.getQueue();
    const pendingItems = queue.filter(item => item.status === 'pending');
    let synced = 0;
    let failed = 0;

    for (const item of pendingItems) {
      try {
        // Dynamic import to avoid circular deps
        const { default: api } = await import('./api.js');
        
        if (item.type === 'test_result') {
          await api.post(`/testing/${item.batchId}`, item.data);
        } else if (item.type === 'batch_create') {
          await api.post('/batches', item.data);
        }

        item.status = 'synced';
        synced++;
      } catch (err) {
        item.status = 'failed';
        item.error = err.message;
        failed++;
      }
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

    // Mark offline results as synced
    if (synced > 0) {
      const results = this.getOfflineResults();
      results.forEach(r => { r.synced = true; });
      localStorage.setItem(OFFLINE_RESULTS_KEY, JSON.stringify(results));
    }

    return { synced, failed };
  }

  // Get pending count
  getPendingCount() {
    return this.getQueue().filter(item => item.status === 'pending').length;
  }

  // Clear synced items
  clearSynced() {
    const queue = this.getQueue().filter(item => item.status !== 'synced');
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }
}

const offlineSync = new OfflineSyncService();
export default offlineSync;
