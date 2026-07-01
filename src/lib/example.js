export const EXAMPLE = `# Aufgabenblatt: Quadratische Funktionen

> **Hinweis:** Bearbeite alle Aufgaben in deinem Heft.

## Aufgabe 1 — Grundlagen

Eine **quadratische Funktion** hat die *Normalform* $f(x) = ax^2 + bx + c$.

Die Lösungen der Gleichung $ax^2 + bx + c = 0$ liefert die Mitternachtsformel:

$$x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

1. Bestimme die Nullstellen von $f(x) = x^2 - 5x + 6$.
2. Skizziere den Graphen.
3. Gib den Scheitelpunkt an.

## Aufgabe 2 — Programmieren

Vervollständige die Funktion:

\`\`\`python
def nullstellen(a, b, c):
    d = b**2 - 4*a*c
    if d < 0:
        return []
    # TODO: beide Lösungen zurückgeben
\`\`\`

## Aufgabe 3 — Ablauf verstehen

\`\`\`mermaid
flowchart TD
    A[Start] --> B{Diskriminante?}
    B -->|d > 0| C[zwei Lösungen]
    B -->|d = 0| D[eine Lösung]
    B -->|d < 0| E[keine Lösung]
\`\`\`

## Material

- Erklärvideo: ![Quadratische Funktionen](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
- Ein Bild bindest du so ein: \`![Beschreibung](https://example.com/bild.png)\`
`
