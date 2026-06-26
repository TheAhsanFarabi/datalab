// Tiny promise wrapper over IndexedDB for notebook storage. IndexedDB instead
// of localStorage because notebooks carry uploaded CSV data and cached outputs,
// which can easily blow past localStorage's ~5MB limit.

const DB_NAME = "datalab-workspace";
const STORE = "notebooks";
let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putNotebook(nb) {
  const db = await openDb();
  return wrap(tx(db, "readwrite").put(nb));
}

export async function getNotebook(id) {
  const db = await openDb();
  return wrap(tx(db, "readonly").get(id));
}

export async function deleteNotebook(id) {
  const db = await openDb();
  return wrap(tx(db, "readwrite").delete(id));
}

export async function listNotebooks() {
  const db = await openDb();
  const all = await wrap(tx(db, "readonly").getAll());
  return all
    .map(({ id, name, createdAt, updatedAt, cells, files }) => ({
      id, name, createdAt, updatedAt,
      cellCount: cells?.length || 0,
      fileCount: files?.length || 0
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
