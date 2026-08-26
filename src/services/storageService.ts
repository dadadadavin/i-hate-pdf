import { openDB, IDBPDatabase } from 'idb';
import { PageItem, SourceFile, PdfMetadata, CompressionSettings } from '../types';

const DB_NAME = 'ihatepdf_workspace_db';
const DB_VERSION = 1;
const STORE_STATE = 'workspace_state';
const STORE_FILES = 'source_files';
const STORE_PAGES = 'page_items';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_STATE)) {
          db.createObjectStore(STORE_STATE);
        }
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          db.createObjectStore(STORE_FILES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PAGES)) {
          db.createObjectStore(STORE_PAGES, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export interface StoredSession {
  pageOrder: string[];
  pages: PageItem[];
  files: SourceFile[];
  metadata?: PdfMetadata;
  compression?: CompressionSettings;
  savedAt: number;
}

/**
 * Save current workspace session to IndexedDB
 */
export async function saveWorkspaceSession(
  pages: PageItem[],
  files: SourceFile[],
  metadata?: PdfMetadata,
  compression?: CompressionSettings
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_STATE, STORE_FILES, STORE_PAGES], 'readwrite');

    // Clear previous pages and files
    await tx.objectStore(STORE_FILES).clear();
    await tx.objectStore(STORE_PAGES).clear();

    // Store source files
    for (const file of files) {
      await tx.objectStore(STORE_FILES).put(file);
    }

    // Store page items (converting any object URLs to persistent items)
    for (const page of pages) {
      await tx.objectStore(STORE_PAGES).put(page);
    }

    // Store state metadata
    await tx.objectStore(STORE_STATE).put(
      {
        pageOrder: pages.map((p) => p.id),
        metadata,
        compression,
        savedAt: Date.now(),
      },
      'current_session'
    );

    await tx.done;
  } catch (err) {
    console.warn('Could not save session to IndexedDB:', err);
  }
}

/**
 * Restore workspace session from IndexedDB if exists
 */
export async function loadWorkspaceSession(): Promise<StoredSession | null> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_STATE, STORE_FILES, STORE_PAGES], 'readonly');

    const sessionMeta = await tx.objectStore(STORE_STATE).get('current_session');
    if (!sessionMeta || !sessionMeta.pageOrder || sessionMeta.pageOrder.length === 0) {
      return null;
    }

    const files = (await tx.objectStore(STORE_FILES).getAll()) as SourceFile[];
    const rawPages = (await tx.objectStore(STORE_PAGES).getAll()) as PageItem[];

    // Index pages by ID
    const pagesMap = new Map<string, PageItem>();
    for (const page of rawPages) {
      // Re-generate a valid blob URL for thumbnail if needed
      pagesMap.set(page.id, page);
    }

    // Order pages according to pageOrder
    const orderedPages: PageItem[] = [];
    for (const id of sessionMeta.pageOrder) {
      const p = pagesMap.get(id);
      if (p) {
        orderedPages.push(p);
      }
    }

    return {
      pageOrder: sessionMeta.pageOrder,
      pages: orderedPages,
      files,
      metadata: sessionMeta.metadata,
      compression: sessionMeta.compression,
      savedAt: sessionMeta.savedAt,
    };
  } catch (err) {
    console.warn('Could not load session from IndexedDB:', err);
    return null;
  }
}

/**
 * Clear the entire saved session
 */
export async function clearWorkspaceSession(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_STATE, STORE_FILES, STORE_PAGES], 'readwrite');
    await tx.objectStore(STORE_STATE).clear();
    await tx.objectStore(STORE_FILES).clear();
    await tx.objectStore(STORE_PAGES).clear();
    await tx.done;
  } catch (err) {
    console.warn('Could not clear IndexedDB session:', err);
  }
}
