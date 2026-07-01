// Funktionsplotter für ```plot-Codeblöcke im Markdown, z. B.:
//
//   ```plot
//   f(x) = x^2 - 5x + 6
//   g(x) = 2x - 3
//   x: -3..8
//   y: -10..10
//   ```
//
// Eigener kleiner Ausdrucksparser (Shunting-Yard) statt eval() — es wird nie
// Code aus dem Dokument ausgeführt. Ausgabe ist ein SVG-Koordinatensystem,
// dessen Farben über CSS-Variablen an Light/Dark Mode gekoppelt sind.

const FUNCS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sgn: Math.sign,
}

const CONSTS = { pi: Math.PI, e: Math.E }

function tokenize(src) {
  const tokens = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ' || c === '\t') {
      i++
    } else if (/[0-9.]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j])) j++
      const num = parseFloat(src.slice(i, j))
      if (Number.isNaN(num)) throw new Error(`Ungültige Zahl bei „${src.slice(i, j)}“`)
      tokens.push({ type: 'num', value: num })
      i = j
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++
      tokens.push({ type: 'name', value: src.slice(i, j) })
      i = j
    } else if ('+-*/^(),'.includes(c)) {
      tokens.push({ type: c })
      i++
    } else {
      throw new Error(`Unbekanntes Zeichen „${c}“`)
    }
  }
  return tokens
}

// implizite Multiplikation einfügen: 2x, 5(x+1), x sin(x), )(
function addImplicitMul(tokens) {
  const out = []
  for (const t of tokens) {
    const prev = out[out.length - 1]
    if (
      prev &&
      (prev.type === 'num' || prev.type === 'name' || prev.type === ')') &&
      (t.type === 'num' || t.type === '(' ||
        (t.type === 'name' && !(prev.type === 'name' && prev.value in FUNCS)))
    ) {
      if (!(prev.type === 'name' && prev.value in FUNCS)) out.push({ type: '*' })
    }
    out.push(t)
  }
  return out
}

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, 'neg': 4 }
const RIGHT = { '^': true, neg: true }

function toRpn(tokens) {
  const out = []
  const ops = []
  let prev = null
  for (const t of tokens) {
    if (t.type === 'num' || (t.type === 'name' && !(t.value in FUNCS))) {
      out.push(t)
    } else if (t.type === 'name') {
      ops.push(t)
    } else if (t.type === ',') {
      while (ops.length && ops[ops.length - 1].type !== '(') out.push(ops.pop())
    } else if (t.type === '(') {
      ops.push(t)
    } else if (t.type === ')') {
      while (ops.length && ops[ops.length - 1].type !== '(') out.push(ops.pop())
      if (!ops.length) throw new Error('Klammer ohne Gegenstück')
      ops.pop()
      if (ops.length && ops[ops.length - 1].type === 'name') out.push(ops.pop())
    } else {
      // Operator; unäres Minus/Plus erkennen
      let op = t.type
      const unary = !prev || ['+', '-', '*', '/', '^', '(', ','].includes(prev.type)
      if (unary && op === '-') op = 'neg'
      if (unary && op === '+') { prev = t; continue }
      while (
        ops.length &&
        ops[ops.length - 1].type !== '(' &&
        ops[ops.length - 1].type !== 'name' &&
        (PREC[ops[ops.length - 1].type] > PREC[op] ||
          (PREC[ops[ops.length - 1].type] === PREC[op] && !RIGHT[op]))
      ) {
        out.push(ops.pop())
      }
      ops.push({ type: op })
    }
    prev = t
  }
  while (ops.length) {
    const op = ops.pop()
    if (op.type === '(') throw new Error('Klammer ohne Gegenstück')
    out.push(op)
  }
  return out
}

export function compileExpression(src) {
  const rpn = toRpn(addImplicitMul(tokenize(src)))
  if (!rpn.length) throw new Error('Leerer Ausdruck')
  return (x) => {
    const stack = []
    for (const t of rpn) {
      if (t.type === 'num') stack.push(t.value)
      else if (t.type === 'name') {
        if (t.value in FUNCS) stack.push(FUNCS[t.value](stack.pop()))
        else if (t.value === 'x') stack.push(x)
        else if (t.value in CONSTS) stack.push(CONSTS[t.value])
        else throw new Error(`Unbekannter Name „${t.value}“`)
      } else if (t.type === 'neg') {
        stack.push(-stack.pop())
      } else {
        const b = stack.pop()
        const a = stack.pop()
        if (a === undefined || b === undefined) throw new Error('Unvollständiger Ausdruck')
        if (t.type === '+') stack.push(a + b)
        else if (t.type === '-') stack.push(a - b)
        else if (t.type === '*') stack.push(a * b)
        else if (t.type === '/') stack.push(a / b)
        else stack.push(a ** b)
      }
    }
    if (stack.length !== 1) throw new Error('Unvollständiger Ausdruck')
    return stack[0]
  }
}

function parseRange(value) {
  const m = value.match(/^\s*(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)\s*$/)
  if (!m) throw new Error(`Bereich „${value}“ nicht lesbar (erwartet z. B. -5..5)`)
  const lo = parseFloat(m[1])
  const hi = parseFloat(m[2])
  if (!(hi > lo)) throw new Error(`Bereich „${value}“ ist leer`)
  return [lo, hi]
}

export function parsePlotSpec(src) {
  const spec = { fns: [], x: [-5, 5], y: null, height: 360 }
  for (const rawLine of src.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('//') || line.startsWith('#')) continue
    const fn = line.match(/^([a-zA-Z][a-zA-Z0-9]*)\s*\(\s*x\s*\)\s*=\s*(.+)$/)
    if (fn) {
      spec.fns.push({ label: `${fn[1]}(x)`, eval: compileExpression(fn[2]) })
      continue
    }
    const opt = line.match(/^(x|y|höhe|height)\s*[:=]\s*(.+)$/i)
    if (opt) {
      const key = opt[1].toLowerCase()
      if (key === 'x') spec.x = parseRange(opt[2])
      else if (key === 'y') spec.y = parseRange(opt[2])
      else spec.height = Math.min(800, Math.max(120, parseFloat(opt[2]) || 360))
      continue
    }
    throw new Error(`Zeile nicht verstanden: „${line}“`)
  }
  if (!spec.fns.length) throw new Error('Keine Funktion angegeben (z. B. f(x) = x^2)')
  return spec
}

function niceStep(range) {
  const raw = range / 8
  const mag = 10 ** Math.floor(Math.log10(raw))
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (raw <= m * mag) return m * mag
  }
  return 10 * mag
}

function fmt(n) {
  return Number(n.toFixed(6)).toString().replace('.', ',')
}

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')

let plotUid = 0

export function renderPlot(src) {
  const uid = `plotclip-${++plotUid}`
  let spec
  try {
    spec = parsePlotSpec(src)
  } catch (err) {
    return `<div class="plot-error">Plot-Fehler: ${esc(err.message)}</div>`
  }

  const W = 560
  const H = spec.height
  const M = { l: 44, r: 12, t: 12, b: 30 }
  const iw = W - M.l - M.r
  const ih = H - M.t - M.b
  const [x0, x1] = spec.x

  // y-Bereich automatisch aus den Funktionswerten bestimmen, falls nicht gesetzt
  const samples = spec.fns.map((f) => {
    const pts = []
    const n = 400
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n
      let y
      try {
        y = f.eval(x)
      } catch {
        return { error: true, pts: [] }
      }
      pts.push([x, Number.isFinite(y) ? y : NaN])
    }
    return { pts }
  })

  let [y0, y1] = spec.y ?? [Infinity, -Infinity]
  if (!spec.y) {
    const values = samples
      .flatMap((s) => s.pts.map((p) => p[1]))
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
    if (values.length) {
      // Ausreißer (Polstellen) abschneiden, damit der Graph lesbar bleibt
      y0 = values[Math.floor(values.length * 0.02)]
      y1 = values[Math.ceil(values.length * 0.98) - 1]
    }
    if (!Number.isFinite(y0) || !Number.isFinite(y1)) [y0, y1] = [-5, 5]
    if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1 }
    const pad = (y1 - y0) * 0.08
    y0 -= pad
    y1 += pad
  }

  const px = (x) => M.l + ((x - x0) / (x1 - x0)) * iw
  const py = (y) => M.t + ((y1 - y) / (y1 - y0)) * ih

  let out = ''

  // Gitter + Achsenbeschriftung
  const xs = niceStep(x1 - x0)
  const ys = niceStep(y1 - y0)
  for (let x = Math.ceil(x0 / xs) * xs; x <= x1 + 1e-9; x += xs) {
    const gx = px(x)
    out += `<line x1="${gx}" y1="${M.t}" x2="${gx}" y2="${M.t + ih}" class="plot-grid"/>`
    out += `<text x="${gx}" y="${M.t + ih + 16}" text-anchor="middle" class="plot-label">${fmt(x)}</text>`
  }
  for (let y = Math.ceil(y0 / ys) * ys; y <= y1 + 1e-9; y += ys) {
    const gy = py(y)
    out += `<line x1="${M.l}" y1="${gy}" x2="${M.l + iw}" y2="${gy}" class="plot-grid"/>`
    out += `<text x="${M.l - 6}" y="${gy + 3.5}" text-anchor="end" class="plot-label">${fmt(y)}</text>`
  }

  // Achsen (durch den Ursprung, wenn sichtbar, sonst am Rand)
  const axisX = y0 <= 0 && y1 >= 0 ? py(0) : M.t + ih
  const axisY = x0 <= 0 && x1 >= 0 ? px(0) : M.l
  out += `<line x1="${M.l}" y1="${axisX}" x2="${M.l + iw}" y2="${axisX}" class="plot-axis"/>`
  out += `<line x1="${axisY}" y1="${M.t}" x2="${axisY}" y2="${M.t + ih}" class="plot-axis"/>`

  // Funktionsgraphen (Lücken bei Polstellen/NaN)
  spec.fns.forEach((f, idx) => {
    const color = (idx % 6) + 1
    const s = samples[idx]
    if (s.error) return
    let d = ''
    let pen = false
    for (const [x, y] of s.pts) {
      if (!Number.isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) {
        pen = false
        continue
      }
      const cy = Math.max(M.t - 20, Math.min(M.t + ih + 20, py(y)))
      d += `${pen ? 'L' : 'M'}${px(x).toFixed(1)} ${cy.toFixed(1)}`
      pen = true
    }
    out += `<path d="${d}" fill="none" class="plot-fn plot-c${color}" clip-path="url(#${uid})"/>`
    out += `<text x="${M.l + iw - 8}" y="${M.t + 16 + idx * 17}" text-anchor="end" class="plot-legend plot-c${color}">${esc(f.label)}</text>`
  })

  return (
    `<figure class="plot"><svg viewBox="0 0 ${W} ${H}" role="img" ` +
    `preserveAspectRatio="xMidYMid meet"><clipPath id="${uid}"><rect x="${M.l}" y="${M.t}" width="${iw}" height="${ih}"/></clipPath>${out}</svg></figure>`
  )
}
