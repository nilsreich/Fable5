<script>
  import { renderMarkdown, renderMermaid } from './markdown.js'
  import { theme } from './theme.svelte.js'

  let { md = '' } = $props()

  let container = $state(null)
  const html = $derived(renderMarkdown(md))

  $effect(() => {
    // hängt von html + Theme ab: nach jedem Re-Render Mermaid-Blöcke umwandeln
    html
    if (container) renderMermaid(container, theme.current)
  })
</script>

{#key theme.current}
  <div class="markdown-body" bind:this={container}>
    {@html html}
  </div>
{/key}
