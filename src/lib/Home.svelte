<script>
  import { listSheets, createSheet, deleteSheet, sheetTitle, exportAll, importAll } from './db.js'
  import { encodeMarkdown } from './urlcodec.js'
  import { theme, toggleTheme } from './theme.svelte.js'
  import { EXAMPLE } from './example.js'

  let sheets = $state([])
  let query = $state('')
  let toast = $state('')
  let importInput = $state(null)

  const filtered = $derived(
    query.trim()
      ? sheets.filter((s) =>
          (sheetTitle(s.markdown) + '\n' + s.markdown)
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        )
      : sheets
  )

  async function refresh() {
    sheets = await listSheets()
  }

  refresh()

  function showToast(msg) {
    toast = msg
    setTimeout(() => (toast = ''), 3000)
  }

  async function newSheet(markdown = '# Neues Arbeitsblatt\n\n') {
    const sheet = await createSheet(markdown)
    location.hash = `d/${sheet.id}`
  }

  function openSheet(id) {
    location.hash = `d/${id}`
  }

  async function copyShareLink(sheet) {
    const code = await encodeMarkdown(sheet.markdown)
    const url = `${location.origin}${location.pathname}#${code}`
    try {
      await navigator.clipboard.writeText(url)
      showToast(`Link kopiert (${url.length} Zeichen)`)
    } catch {
      showToast(url)
    }
  }

  async function remove(sheet) {
    if (!confirm(`„${sheetTitle(sheet.markdown)}“ wirklich löschen?`)) return
    await deleteSheet(sheet.id)
    refresh()
  }

  async function exportBackup() {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `arbeitsblaetter-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importChosen(event) {
    const file = event.target.files[0]
    if (!file) return
    try {
      const count = await importAll(JSON.parse(await file.text()))
      showToast(`${count} Arbeitsblätter importiert`)
      refresh()
    } catch (err) {
      showToast(`Import fehlgeschlagen: ${err.message}`)
    }
    event.target.value = ''
  }

  const dateFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' })

  function snippet(markdown) {
    return markdown
      .replace(/^#{1,6}\s+.+$/m, '')
      .replace(/[#>*`$!\[\]()|\\{}^_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120)
  }
</script>

<div class="home">
  <header class="home-header">
    <h1>Arbeitsblätter</h1>
    <span class="spacer"></span>
    <button class="icon-btn" onclick={toggleTheme} title="Hell/Dunkel umschalten" aria-label="Hell/Dunkel umschalten">
      {theme.current === 'dark' ? '☀️' : '🌙'}
    </button>
    <button onclick={exportBackup} title="Alle Arbeitsblätter als JSON-Datei sichern">
      Alle exportieren
    </button>
    <button onclick={() => importInput.click()} title="JSON-Backup einlesen">Importieren</button>
    <button class="primary" onclick={() => newSheet()}>＋ Neues Arbeitsblatt</button>
    <input type="file" accept=".json,application/json" bind:this={importInput} onchange={importChosen} hidden />
  </header>

  <div class="home-search">
    <input
      type="search"
      placeholder="Arbeitsblätter durchsuchen …"
      bind:value={query}
      aria-label="Arbeitsblätter durchsuchen"
    />
  </div>

  {#if sheets.length === 0}
    <div class="empty">
      <p>Noch keine Arbeitsblätter.</p>
      <button class="primary" onclick={() => newSheet()}>Erstes Arbeitsblatt erstellen</button>
      <button onclick={() => newSheet(EXAMPLE)}>Beispiel ansehen</button>
    </div>
  {:else if filtered.length === 0}
    <p class="empty">Nichts gefunden für „{query}“.</p>
  {:else}
    <ul class="sheet-grid">
      {#each filtered as sheet (sheet.id)}
        <li class="sheet-card">
          <button class="sheet-open" onclick={() => openSheet(sheet.id)}>
            <strong>{sheetTitle(sheet.markdown)}</strong>
            <span class="sheet-snippet">{snippet(sheet.markdown)}</span>
            <time>{dateFmt.format(sheet.updatedAt)}</time>
          </button>
          <div class="sheet-actions">
            <button class="icon-btn" onclick={() => copyShareLink(sheet)} title="Link für Schüler kopieren" aria-label="Link kopieren">🔗</button>
            <button class="icon-btn" onclick={() => remove(sheet)} title="Löschen" aria-label="Löschen">🗑️</button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}

  {#if toast}<div class="toast">{toast}</div>{/if}
</div>
