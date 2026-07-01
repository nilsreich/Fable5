<script>
  import Preview from './Preview.svelte'
  import { encodeMarkdown } from './urlcodec.js'

  let { markdown = $bindable('') } = $props()

  let fileInput = $state(null)
  let shareInfo = $state('')
  let fileName = $state('aufgabenblatt.md')

  // Editor-Zustand fortlaufend in die URL schreiben (#e/<code>), damit
  // Reload/Lesezeichen nichts verlieren. replaceState löst kein hashchange aus.
  let syncTimer
  $effect(() => {
    const text = markdown
    clearTimeout(syncTimer)
    syncTimer = setTimeout(async () => {
      const code = await encodeMarkdown(text)
      history.replaceState(null, '', `#e/${code}`)
    }, 400)
    return () => clearTimeout(syncTimer)
  })

  async function shareLink() {
    const code = await encodeMarkdown(markdown)
    const url = `${location.origin}${location.pathname}#${code}`
    try {
      await navigator.clipboard.writeText(url)
      shareInfo = `Link kopiert (${url.length} Zeichen)`
    } catch {
      shareInfo = url
    }
    setTimeout(() => (shareInfo = ''), 4000)
  }

  function openFile() {
    fileInput.click()
  }

  async function fileChosen(event) {
    const file = event.target.files[0]
    if (!file) return
    markdown = await file.text()
    fileName = file.name
    event.target.value = ''
  }

  function saveFile() {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName
    a.click()
    URL.revokeObjectURL(a.href)
  }
</script>

<div class="editor-layout">
  <header class="toolbar">
    <strong>Aufgabenblatt-Editor</strong>
    <span class="spacer"></span>
    <button onclick={openFile}>📂 Öffnen</button>
    <button onclick={saveFile}>💾 Speichern</button>
    <button class="primary" onclick={shareLink}>🔗 Link teilen</button>
    {#if shareInfo}<span class="share-info">{shareInfo}</span>{/if}
    <input
      type="file"
      accept=".md,.markdown,.txt,text/markdown"
      bind:this={fileInput}
      onchange={fileChosen}
      hidden
    />
  </header>
  <div class="panes">
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
</div>
