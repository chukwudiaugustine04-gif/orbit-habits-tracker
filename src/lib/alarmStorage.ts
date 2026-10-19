/**
 * IndexedDB-backed storage for user-uploaded custom alarm audio.
 * Stores the raw file bytes + metadata so alarms can play offline and
 * persist across reloads without requiring Supabase Storage.
 */

const DB_NAME = 'orbit-alarm-sounds';
const DB_VERSION = 1;
const STORE = 'sounds';

export interface StoredSound {
  id: string;
  name: string;
  type: string; // mime type, e.g. audio/mpeg
  size: number;
  arrayBuffer: ArrayBuffer;
  createdAt: number;
}

export interface SoundMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `snd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveSound(file: File): Promise<SoundMeta> {
  const db = await openDb();
  const arrayBuffer = await file.arrayBuffer();
  const record: StoredSound = {
    id: genId(),
    name: file.name,
    type: file.type || 'audio/*',
    size: file.size,
    arrayBuffer,
    createdAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return { id: record.id, name: record.name, type: record.type, size: record.size, createdAt: record.createdAt };
}

export async function getSound(id: string): Promise<StoredSound | null> {
  const db = await openDb();
  const result = await new Promise<StoredSound | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as StoredSound | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result ?? null;
}

export async function listSounds(): Promise<SoundMeta[]> {
  const db = await openDb();
  const all = await new Promise<StoredSound[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as StoredSound[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all
    .map((s) => ({ id: s.id, name: s.name, type: s.type, size: s.size, createdAt: s.createdAt }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSound(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
