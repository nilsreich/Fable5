// Lokale Ablage aller Arbeitsblätter in IndexedDB — kein Server, keine Datenbank
// außerhalb des Geräts. Ein Blatt: { id, markdown, createdAt, updatedAt }.

const DB_NAME = 'aufgabenblaetter'
const STORE = 'sheets'

let dbPromise = null

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

function tx(mode, run) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const result = run(t.objectStore(STORE))
        t.oncomplete = () => resolve(result.result ?? result)
        t.onerror = () => reject(t.error)
      })
  )
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function sheetTitle(markdown) {
  const m = markdown.match(/^#{1,6}\s+(.+)$/m)
  return m ? m[1].trim() : 'Ohne Titel'
}

export async function listSheets() {
  const sheets = await tx('readonly', (store) => store.getAll())
  return sheets.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getSheet(id) {
  return tx('readonly', (store) => store.get(id))
}

export function putSheet(sheet) {
  return tx('readwrite', (store) => store.put(sheet))
}

export function deleteSheet(id) {
  return tx('readwrite', (store) => store.delete(id))
}

export async function createSheet(markdown) {
  const now = Date.now()
  const sheet = { id: newId(), markdown, createdAt: now, updatedAt: now }
  await putSheet(sheet)
  return sheet
}

export async function saveMarkdown(id, markdown) {
  const existing = await getSheet(id)
  const now = Date.now()
  await putSheet(
    existing
      ? { ...existing, markdown, updatedAt: now }
      : { id, markdown, createdAt: now, updatedAt: now }
  )
}

// Backup: alle Blätter als JSON exportieren / wieder einlesen
export async function exportAll() {
  return {
    app: 'aufgabenblatt',
    version: 1,
    exportedAt: new Date().toISOString(),
    sheets: await listSheets(),
  }
}

export async function importAll(data) {
  if (data?.app !== 'aufgabenblatt' || !Array.isArray(data.sheets)) {
    throw new Error('Kein gültiges Backup')
  }
  let count = 0
  for (const sheet of data.sheets) {
    if (typeof sheet.id !== 'string' || typeof sheet.markdown !== 'string') continue
    await putSheet({
      id: sheet.id,
      markdown: sheet.markdown,
      createdAt: sheet.createdAt ?? Date.now(),
      updatedAt: sheet.updatedAt ?? Date.now(),
    })
    count++
  }
  return count
}
