<script>
  import { renderMarkdown, renderMermaid } from './markdown.js'

  let { md = '' } = $props()

  let container = $state(null)
  const html = $derived(renderMarkdown(md))

  $effect(() => {
    // hängt von html ab: nach jedem Re-Render Mermaid-Blöcke umwandeln
    html
    if (container) renderMermaid(container)
  })
</script>

<div class="markdown-body" bind:this={container}>
  {@html html}
</div>
