export function recoveryStore(key) {
  async function run(mode, action) {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("onodocs-recovery");
      request.onupgradeneeded = () => request.result.createObjectStore("documents");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction("documents", mode);
        const request = action(transaction.objectStore("documents"));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onabort = () => reject(transaction.error ?? request.error);
        transaction.onerror = () => reject(transaction.error);
      });
    } finally { db.close(); }
  }
  return {
    read: () => run("readonly", store => store.get(key)),
    write: bytes => run("readwrite", store => store.put(bytes, key)),
    remove: () => run("readwrite", store => store.delete(key))
  };
}
