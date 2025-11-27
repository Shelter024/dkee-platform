// Background sync utilities for offline-first operations
// Handles queuing and syncing of operations when offline

export interface SyncOperation {
  id: string;
  type: 'sale' | 'form' | 'upload' | 'update';
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
}

const SYNC_STORE = 'pending-sync-operations';

/**
 * Check if background sync is supported
 */
export function isSyncSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'SyncManager' in window
  );
}

/**
 * Register a background sync task
 */
export async function registerSync(tag: string): Promise<void> {
  if (!isSyncSupported()) {
    console.warn('Background sync not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
    console.log(`Background sync registered: ${tag}`);
  } catch (error) {
    console.error('Failed to register background sync:', error);
  }
}

/**
 * Queue an operation for background sync
 */
export async function queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<string> {
  const id = `${operation.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();

  const syncOperation: SyncOperation = {
    ...operation,
    id,
    timestamp,
  };

  // Store in IndexedDB
  await addToSyncStore(syncOperation);

  // Register background sync
  await registerSync(`sync-${operation.type}`);

  return id;
}

/**
 * Add operation to IndexedDB
 */
async function addToSyncStore(operation: SyncOperation): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_STORE, 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      
      store.add(operation);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('operations')) {
        db.createObjectStore('operations', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Get all pending operations
 */
export async function getPendingOperations(): Promise<SyncOperation[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_STORE, 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['operations'], 'readonly');
      const store = transaction.objectStore('operations');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        db.close();
        resolve(getAllRequest.result || []);
      };

      getAllRequest.onerror = () => {
        db.close();
        reject(getAllRequest.error);
      };
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('operations')) {
        db.createObjectStore('operations', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Remove operation from store
 */
export async function removeOperation(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_STORE, 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      
      store.delete(id);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    };
  });
}

/**
 * Execute a pending operation
 */
export async function executeOperation(operation: SyncOperation): Promise<boolean> {
  try {
    const response = await fetch(operation.url, {
      method: operation.method,
      headers: {
        'Content-Type': 'application/json',
        ...operation.headers,
      },
      body: operation.body ? JSON.stringify(operation.body) : undefined,
    });

    if (response.ok) {
      await removeOperation(operation.id);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to execute operation:', error);
    return false;
  }
}

/**
 * Sync all pending operations
 */
export async function syncAllOperations(): Promise<void> {
  const operations = await getPendingOperations();

  for (const operation of operations) {
    await executeOperation(operation);
  }
}

/**
 * Queue a sale for background sync
 */
export async function queueSale(saleData: any): Promise<string> {
  return queueOperation({
    type: 'sale',
    url: '/api/sales/parts',
    method: 'POST',
    body: saleData,
  });
}

/**
 * Queue a form submission for background sync
 */
export async function queueFormSubmission(url: string, formData: any): Promise<string> {
  return queueOperation({
    type: 'form',
    url,
    method: 'POST',
    body: formData,
  });
}

/**
 * Check online status and trigger sync if online
 */
export function setupOnlineListener(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('Back online - syncing pending operations');
    await syncAllOperations();
  });
}

/**
 * Get count of pending operations
 */
export async function getPendingCount(): Promise<number> {
  const operations = await getPendingOperations();
  return operations.length;
}
