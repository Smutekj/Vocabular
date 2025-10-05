import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'my_game_db';
const DB_VERSION = 1;
const STORE_NAME = 'settings';

let dbPromise: Promise<IDBPDatabase<any>>;

export function initDB() {
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
  return dbPromise;
}

export async function setItem(key: string, value: any) {
  const db = await dbPromise;
  return db.put(STORE_NAME, value, key);
}

export async function getItem<T = any>(key: string): Promise<T | undefined> {
  const db = await dbPromise;
  return db.get(STORE_NAME, key);
}

export async function deleteItem(key: string) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, key);
}
