const DB_NAME = 'rontzen-platform-v1'
const STORE = 'files'
const KEY_DEMO = 'product-demo-video'
const KEY_SCREENSHOTS = 'product-screenshots-v1'
const MAX_VIDEO_BYTES = 200 * 1024 * 1024
const MAX_SHOT_BYTES = 12 * 1024 * 1024
const MAX_SCREENSHOTS = 30

export type LoadedProductDemo = {
  filename: string
  blob: Blob
  mime: string
}

export type StoredScreenshotRow = {
  id: string
  filename: string
  mime: string
  updatedAt: number
  data: ArrayBuffer
}

export type LoadedScreenshot = {
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

export async function saveProductDemoVideo(file: File): Promise<void> {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`Video must be under ${Math.round(MAX_VIDEO_BYTES / (1024 * 1024))} MB.`)
  }
  const mime = file.type || 'video/mp4'
  if (!mime.startsWith('video/')) {
    throw new Error('Please choose a video file (MP4, WebM, etc.).')
  }
  const data = await file.arrayBuffer()
  const row = {
    filename: file.name || 'demo.mp4',
    mime,
    updatedAt: Date.now(),
    data,
  }
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
    tx.objectStore(STORE).put(row, KEY_DEMO)
  })
}

export async function loadProductDemoVideo(): Promise<LoadedProductDemo | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(KEY_DEMO)
    req.onsuccess = () => {
      const row = req.result as { filename?: string; mime?: string; data?: ArrayBuffer } | undefined
      if (!row?.data) {
        resolve(null)
        return
      }
      const mime = row.mime || 'video/mp4'
      resolve({
        filename: row.filename || 'demo.mp4',
        blob: new Blob([row.data], { type: mime }),
        mime,
      })
    }
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'))
  })
}

export async function clearProductDemoVideo(): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(KEY_DEMO)
  })
}

export async function loadProductScreenshotRows(): Promise<StoredScreenshotRow[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(KEY_SCREENSHOTS)
    req.onsuccess = () => {
      const raw = req.result as StoredScreenshotRow[] | undefined
      resolve(Array.isArray(raw) ? raw : [])
    }
    req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'))
  })
}

export async function loadProductScreenshots(): Promise<LoadedScreenshot[]> {
  const raw = await loadProductScreenshotRows()
  return raw.map((row) => ({
    id: row.id,
    filename: row.filename,
    mime: row.mime || 'image/png',
    blob: new Blob([row.data], { type: row.mime || 'image/png' }),
  }))
}

export async function saveProductScreenshots(rows: StoredScreenshotRow[]): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'))
    tx.objectStore(STORE).put(rows, KEY_SCREENSHOTS)
  })
}

export async function clearProductScreenshots(): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'))
    tx.objectStore(STORE).delete(KEY_SCREENSHOTS)
  })
}

export { MAX_SHOT_BYTES, MAX_SCREENSHOTS }
