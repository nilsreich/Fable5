<script>
  import Preview from './Preview.svelte'
  import { encodeMarkdown } from './urlcodec.js'
  import { saveMarkdown, sheetTitle } from './db.js'
  import { theme, toggleTheme } from './theme.svelte.js'

  let { id, initial = '' } = $props()

  let markdown = $state(initial)
  let fileInput = $state(null)
  let toast = $state('')
  let saved = $state(true)
  let pane = $state('edit') // auf schmalen Screens: 'edit' | 'preview'

  // Änderungen fortlaufend in IndexedDB sichern (debounced)
  let saveTimer
  $effect(() => {
    const text = markdown
    saved = false
    clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      await saveMarkdown(id, text)
      saved = true
    }, 400)
    return () => clearTimeout(saveTimer)
  })

  function showToast(msg) {
    toast = msg
    setTimeout(() => (toast = ''), 3000)
  }

  async function shareLink() {
    const code = await encodeMarkdown(markdown)
    const url = `${location.origin}${location.pathname}#${code}`
    try {
      await navigator.clipboard.writeText(url)
      showToast(`Link kopiert (${url.length} Zeichen)`)
    } catch {
      showToast(url)
    }
  }

  async function fileChosen(event) {
    const file = event.target.files[0]
    if (!file) return
    markdown = await file.text()
    event.target.value = ''
  }

  function saveFile() {
    const name = sheetTitle(markdown).replace(/[^\wäöüÄÖÜß -]/g, '').trim() || 'arbeitsblatt'
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${name}.md`
    a.click()
    URL.revokeObjectURL(a.href)
  }
</script>

<div class="editor-layout">
  <header class="toolbar">
    <button class="icon-btn" onclick={() => (location.hash = '')} title="Zur Übersicht" aria-label="Zur Übersicht">←</button>
    <strong class="doc-title">{sheetTitle(markdown)}</strong>
    <span class="save-state" class:saved>{saved ? 'Gespeichert' : 'Speichert …'}</span>
    <span class="spacer"></span>
    <div class="pane-switch" role="tablist" aria-label="Ansicht wählen">
      <button role="tab" aria-selected={pane === 'edit'} class:active={pane === 'edit'} onclick={() => (pane = 'edit')}>Bearbeiten</button>
      <button role="tab" aria-selected={pane === 'preview'} class:active={pane === 'preview'} onclick={() => (pane = 'preview')}>Vorschau</button>
    </div>
    <button class="icon-btn" onclick={toggleTheme} title="Hell/Dunkel umschalten" aria-label="Hell/Dunkel umschalten">
      {theme.current === 'dark' ? '☀️' : '🌙'}
    </button>
    <button onclick={() => fileInput.click()} title="Markdown-Datei öffnen">Öffnen</button>
    <button onclick={saveFile} title="Als Markdown-Datei speichern">Speichern</button>
    <button class="primary" onclick={shareLink} title="Anzeige-Link für Schüler kopieren">Link teilen</button>
    <input
      type="file"
      accept=".md,.markdown,.txt,text/markdown"
      bind:this={fileInput}
      onchange={fileChosen}
      hidden
    />
  </header>
  <div class="panes" data-pane={pane}>
    <textarea
      class="source"
      bind:value={markdown}
      spellcheck="false"
      placeholder="# Überschrift&#10;&#10;Markdown hier eingeben …"
    ></textarea>
    <div class="preview">
      <Preview md={markdown} />
    </div>
  </div>
  {#if toast}<div class="toast">{toast}</div>{/if}
</div>
