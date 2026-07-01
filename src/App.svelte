<script>
  import Editor from './lib/Editor.svelte'
  import Preview from './lib/Preview.svelte'
  import { decodeMarkdown } from './lib/urlcodec.js'
  import { EXAMPLE } from './lib/example.js'

  // URL-Schema (alles im Hash, damit kein Server nötig ist und der Link kurz bleibt):
  //   #<code>    → nur gerenderte Ansicht (zum Teilen), keine UI-Elemente
  //   #e/<code>  → Editor-Ansicht mit dem Markdown-Quelltext
  //   #e oder leer → Editor mit Beispieldokument
  let mode = $state('loading') // 'loading' | 'edit' | 'view' | 'error'
  let markdown = $state('')

  async function readHash() {
    const hash = decodeURIComponent(location.hash.slice(1))
    try {
      if (hash === '' || hash === 'e' || hash === 'e/') {
        markdown = EXAMPLE
        mode = 'edit'
      } else if (hash.startsWith('e/')) {
        markdown = await decodeMarkdown(hash.slice(2))
        mode = 'edit'
      } else {
        markdown = await decodeMarkdown(hash)
        mode = 'view'
      }
    } catch {
      mode = 'error'
    }
  }

  readHash()

  // Zurück/Vor im Browser sowie manuell geänderte Links unterstützen —
  // aber nicht auf die eigenen replaceState-Updates des Editors reagieren.
  $effect(() => {
    const onHashChange = () => readHash()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })
</script>

{#if mode === 'edit'}
  <Editor bind:markdown />
{:else if mode === 'view'}
  <main class="view-only">
    <Preview md={markdown} />
  </main>
{:else if mode === 'error'}
  <main class="view-only">
    <p>Der Link konnte nicht gelesen werden. <a href="#e">Neues Dokument erstellen</a></p>
  </main>
{/if}
