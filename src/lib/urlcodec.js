// Kodiert Markdown möglichst kurz in die URL:
// UTF-8 → deflate-raw (native CompressionStream) → Base64-URL (ohne Padding).
// Deflate komprimiert typischen Markdown-Text auf ~30-50 % der Ausgangslänge.

const B64_URL = { '+': '-', '/': '_' }
const B64_STD = { '-': '+', _: '/' }

function bytesToBase64Url(bytes) {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(bin).replace(/[+/]/g, (c) => B64_URL[c]).replace(/=+$/, '')
}

function base64UrlToBytes(str) {
  const b64 = str.replace(/[-_]/g, (c) => B64_STD[c])
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream))
  return new Uint8Array(await out.arrayBuffer())
}

export async function encodeMarkdown(text) {
  const raw = new TextEncoder().encode(text)
  const compressed = await pipe(raw, new CompressionStream('deflate-raw'))
  return bytesToBase64Url(compressed)
}

export async function decodeMarkdown(encoded) {
  const compressed = base64UrlToBytes(encoded)
  const raw = await pipe(compressed, new DecompressionStream('deflate-raw'))
  return new TextDecoder().decode(raw)
}
