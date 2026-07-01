<script>
  import Home from './lib/Home.svelte'
  import Editor from './lib/Editor.svelte'
  import Preview from './lib/Preview.svelte'
  import { decodeMarkdown } from './lib/urlcodec.js'
  import { getSheet, createSheet } from './lib/db.js'

  // URL-Schema (alles im Hash, damit kein Server nötig ist und der Link kurz bleibt):
  //   #            → Startbildschirm mit allen Arbeitsblättern
  //   #d/<id>      → Editor für ein lokal gespeichertes Arbeitsblatt
  //   #e/<code>    → geteiltes Dokument importieren und im Editor öffnen
  //   #<code>      → nur gerenderte Ansicht (zum Teilen), keine UI-Elemente
  let mode = $state('loading') // 'loading' | 'home' | 'edit' | 'view' | 'error'
  let sheet = $state(null)
  let markdown = $state('')

  async function readHash() {
    const hash = decodeURIComponent(location.hash.slice(1))
    try {
      if (hash === '' || hash === 'e' || hash === 'e/') {
        mode = 'home'
      } else if (hash.startsWith('d/')) {
        const found = await getSheet(hash.slice(2))
        if (found) {
          sheet = found
          mode = 'edit'
        } else {
          location.hash = ''
        }
      } else if (hash.startsWith('e/')) {
        // geteilter Bearbeiten-Link: als neues Arbeitsblatt übernehmen
        const md = await decodeMarkdown(hash.slice(2))
        const created = await createSheet(md)
        location.replace(`#d/${created.id}`)
      } else {
        markdown = await decodeMarkdown(hash)
        mode = 'view'
      }
    } catch {
      mode = 'error'
    }
  }

  readHash()

  $effect(() => {
    const onHashChange = () => readHash()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })
</script>

{#if mode === 'home'}
  <Home />
{:else if mode === 'edit'}
  {#key sheet.id}
    <Editor id={sheet.id} initial={sheet.markdown} />
  {/key}
{:else if mode === 'view'}
  <main class="view-only">
    <Preview md={markdown} />
  </main>
{:else if mode === 'error'}
  <main class="view-only">
    <p>Der Link konnte nicht gelesen werden. <a href="#">Zur Übersicht</a></p>
  </main>
{/if}
