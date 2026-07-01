import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import markedKatex from 'marked-katex-extension'
import hljs from 'highlight.js/lib/common'
import DOMPurify from 'dompurify'

// Bild-Syntax ![alt](url) wird für Online-Medien erweitert:
// - YouTube-/Vimeo-Links werden als eingebettetes Video (iframe) gerendert
// - direkte Videodateien (.mp4/.webm/.ogg) als <video>-Element
// - alles andere als normales Bild
function youtubeId(url) {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  )
  return m ? m[1] : null
}

function vimeoId(url) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return m ? m[1] : null
}

const mediaRenderer = {
  image({ href, title, text }) {
    const alt = text || ''
    const yt = youtubeId(href)
    if (yt) {
      return `<span class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${yt}" title="${alt}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></span>`
    }
    const vm = vimeoId(href)
    if (vm) {
      return `<span class="video-embed"><iframe src="https://player.vimeo.com/video/${vm}" title="${alt}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></span>`
    }
    if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(href)) {
      return `<video controls preload="metadata" src="${href}" title="${alt}"></video>`
    }
    const titleAttr = title ? ` title="${title}"` : ''
    return `<img src="${href}" alt="${alt}"${titleAttr} loading="lazy" />`
  },
}

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang === 'mermaid') return code
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  })
)

marked.use(
  markedKatex({ throwOnError: false, nonStandard: true }),
  { renderer: mediaRenderer, gfm: true, breaks: true }
)

// Mermaid-Codeblöcke nicht highlighten, sondern als <pre class="mermaid">
// ausgeben; mermaid.run() wandelt sie nach dem Einfügen ins DOM in SVG um.
marked.use({
  renderer: {
    code({ text, lang }) {
      if (lang === 'mermaid') {
        return `<pre class="mermaid">${text
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')}</pre>`
      }
      return false
    },
  },
})

const PURIFY_OPTS = {
  ADD_TAGS: ['iframe', 'video'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading', 'controls', 'preload'],
}

DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  // iframes nur von den erlaubten Videoplattformen zulassen
  if (data.tagName === 'iframe') {
    const src = node.getAttribute('src') || ''
    if (
      !src.startsWith('https://www.youtube-nocookie.com/embed/') &&
      !src.startsWith('https://player.vimeo.com/video/')
    ) {
      node.remove()
    }
  }
})

export function renderMarkdown(src) {
  const html = marked.parse(src, { async: false })
  return DOMPurify.sanitize(html, PURIFY_OPTS)
}

let mermaidPromise = null

// Mermaid ist groß und wird nur geladen, wenn ein Diagramm vorkommt.
export async function renderMermaid(container) {
  const nodes = container.querySelectorAll('pre.mermaid')
  if (!nodes.length) return
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      m.default.initialize({ startOnLoad: false, securityLevel: 'strict' })
      return m.default
    })
  }
  const mermaid = await mermaidPromise
  try {
    await mermaid.run({ nodes })
  } catch {
    // Fehlerhafte Diagramme lassen den Rest der Seite intakt;
    // mermaid zeigt seine Fehlermeldung im jeweiligen Block an.
  }
}
