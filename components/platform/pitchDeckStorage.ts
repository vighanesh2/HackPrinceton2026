const DB_NAME = 'rontzen-platform-v1'
const STORE = 'files'
const KEY = 'embedded-pitch-deck-pdf'
const MAX_BYTES = 80 * 1024 * 1024

export type LoadedPitchDeck = {
  filename: string
  blob: Blob
  mime: string
}

type StoredPitchDeckRow = {
  filename: string
  mime: string
  updatedAt: number
  data: ArrayBuffer
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

export async function saveEmbeddedPitchDeckPdf(file: File): Promise<void> {
  if (file.size > MAX_BYTES) {
    throw new Error(`PDF must be under ${Math.round(MAX_BYTES / (1024 * 1024))} MB for in-app storage.`)
  }
  const data = await file.arrayBuffer()
  const row: StoredPitchDeckRow = {
    filename: file.name || 'deck.pdf',
    mime: file.type || 'application/pdf',
    updatedAt: Date.now(),
    data,
  }
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'))
    tx.objectStore(STORE).put(row, KEY)
  })
}

export async function loadEmbeddedPitchDeckPdf(): Promise<LoadedPitchDeck | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(KEY)
    req.onsuccess = () => {
      const row = req.result as StoredPitchDeckRow | undefined
      if (!row?.data) {
        resolve(null)
        return
      }
      const mime = row.mime || 'application/pdf'
      const blob = new Blob([row.data], { type: mime })
      resolve({ filename: row.filename, blob, mime })
    }
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'))
  })
}

export async function clearEmbeddedPitchDeckPdf(): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(KEY)
  })
}
