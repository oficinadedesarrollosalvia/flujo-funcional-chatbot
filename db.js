/* Almacenamiento local en IndexedDB (soporta pantallazos grandes). */
const DB = (() => {
  const NAME = "salvia-pruebas-chatbot", STORE = "ejecuciones";
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode);
      const r = fn(t.objectStore(STORE));
      t.oncomplete = () => res(r && r.result);
      t.onerror = () => rej(t.error);
    });
  }
  async function close() { if (dbp) { (await dbp).close(); dbp = null; } }
  return {
    close,
    put: (run) => tx("readwrite", s => s.put(run)),
    get: (id) => tx("readonly", s => s.get(id)),
    all: () => tx("readonly", s => s.getAll()),
    del: (id) => tx("readwrite", s => s.delete(id)),
  };
})();
