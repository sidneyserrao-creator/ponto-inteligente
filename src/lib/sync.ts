
'use client';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { recordTimeLog } from './actions';
import type { TimeLogAction } from './types';

const DB_NAME = 'bit-seguranca-db';
const STORE_NAME = 'sync-queue';
const DB_VERSION = 1;

interface SyncDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: {
      userId: string;
      action: TimeLogAction;
      capturedImage: string;
      timestamp: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<SyncDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<SyncDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<SyncDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { autoIncrement: true, keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
};

export const addToSyncQueue = async (
  userId: string,
  action: TimeLogAction,
  capturedImage: string
) => {
  const db = await getDb();
  await db.add(STORE_NAME, {
    userId,
    action,
    capturedImage,
    timestamp: new Date().toISOString(),
  });
};

const processSyncQueue = async () => {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.log('Offline. Skipping sync.');
    return;
  }

  try {
    const db = await getDb();
    const items = await db.getAll(STORE_NAME);

    if (items.length === 0) return;

    console.log(`Syncing ${items.length} items...`);

    for (const item of items) {
      try {
        const result = await recordTimeLog(
          item.userId,
          item.action,
          item.capturedImage,
          item.timestamp
        );
        if (result.success) {
          await db.delete(STORE_NAME, item.key);
          console.log(`Item ${item.key} synced and deleted.`);
        } else {
          console.error(`Failed to sync item ${item.key}:`, result.message);
        }
      } catch (error) {
        console.error(`Error processing item ${item.key}:`, error);
      }
    }

  } catch (error) {
    console.error('Error during sync process:', error);
  }
};


// --- Sync Orchestration ---
let syncInterval: NodeJS.Timeout | null = null;

const startSyncProcess = () => {
    if (typeof window === 'undefined') return;

    // Trigger immediately on load
    processSyncQueue();

    // Then check periodically
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(processSyncQueue, 30 * 1000); // every 30 seconds

    window.addEventListener('online', processSyncQueue);
};

const stopSyncProcess = () => {
    if (typeof window === 'undefined') return;

    if (syncInterval) clearInterval(syncInterval);
    window.removeEventListener('online', processSyncQueue);
};

// Automatically start sync when the module is loaded on the client
if (typeof window !== 'undefined') {
    startSyncProcess();
}

// Export functions for explicit control if needed
export { startSyncProcess, stopSyncProcess, processSyncQueue };
