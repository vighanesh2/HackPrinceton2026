import type { StoredScreenshotRow } from '@/components/platform/productStorage'

const DB_NAME = 'rontzen-platform-v1'
const STORE = 'files'
const KEY_LOGOS = 'traction-logos-v1'
const MAX_LOGOS = 20
const MAX_LOGO_BYTES = 2 * 1024 * 1024

export type LoadedTractionLogo = {
  id: string
  filename: string
  blob: Blob
  mime: string
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

export async function loadTractionLogoRows(): Promise<StoredScreenshotRow[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(KEY_LOGOS)
    req.onsuccess = () => {
      const raw = req.result as StoredScreenshotRow[] | undefined
      resolve(Array.isArray(raw) ? raw : [])
    }
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'))
  })
}

export async function loadTractionLogos(): Promise<LoadedTractionLogo[]> {
  const raw = await loadTractionLogoRows()
  return raw.map((row) => ({
    id: row.id,
    filename: row.filename,
    mime: row.mime || 'image/png',
    blob: new Blob([row.data], { type: row.mime || 'image/png' }),
  }))
}

export async function saveTractionLogos(rows: StoredScreenshotRow[]): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
    tx.objectStore(STORE).put(rows, KEY_LOGOS)
  })
}

export async function clearTractionLogos(): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(KEY_LOGOS)
  })
}

export { MAX_LOGOS, MAX_LOGO_BYTES }
