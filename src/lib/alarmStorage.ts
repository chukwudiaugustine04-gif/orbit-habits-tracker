/**
 * IndexedDB-backed storage for user-uploaded custom alarm audio.
 * Every record is tagged with the owning account's user id, and every read,
 * write, and delete is filtered to the signed-in user, so ringtones never
 * leak between accounts sharing a browser.
 */
import { supabase } from '@/lib/supabase';

const DB_NAME = 'orbit-alarm-sounds';
const DB_VERSION = 2;
const STORE = 'sounds';
const OWNER_INDEX = 'ownerId';

export interface StoredSound {
  id: string;
  ownerId: string;
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
      const store = db.objectStoreNames.contains(STORE)
        ? req.transaction!.objectStore(STORE)
        : db.createObjectStore(STORE, { keyPath: 'id' });
      if (!store.indexNames.contains(OWNER_INDEX)) {
        store.createIndex(OWNER_INDEX, OWNER_INDEX, { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function currentOwnerId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `snd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toMeta(s: StoredSound): SoundMeta {
  return { id: s.id, name: s.name, type: s.type, size: s.size, createdAt: s.createdAt };
}

export async function saveSound(file: File): Promise<SoundMeta> {
  const ownerId = await currentOwnerId();
  if (!ownerId) throw new Error('Sign in to upload custom ringtones');

  const db = await openDb();
  const arrayBuffer = await file.arrayBuffer();
  const record: StoredSound = {
    id: genId(),
    ownerId,
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
  return toMeta(record);
}

export async function getSound(id: string): Promise<StoredSound | null> {
  const ownerId = await currentOwnerId();
  if (!ownerId) return null;

  const db = await openDb();
  const result = await new Promise<StoredSound | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as StoredSound | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!result || result.ownerId !== ownerId) return null;
  return result;
}

export async function listSounds(): Promise<SoundMeta[]> {
  const ownerId = await currentOwnerId();
  if (!ownerId) return [];

  const db = await openDb();
  const owned = await new Promise<StoredSound[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index(OWNER_INDEX).getAll(IDBKeyRange.only(ownerId));
    req.onsuccess = () => resolve((req.result as StoredSound[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return owned.map(toMeta).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteSound(id: string): Promise<void> {
  const owned = await getSound(id);
  if (!owned) return;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
