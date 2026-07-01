# Aufgabenblatt

Eine Svelte-5-/Vite-8-PWA zum Erstellen und Teilen von Arbeitsblättern als
Markdown — komplett ohne Server und externe Datenbank: Geteilte Dokumente
stecken komprimiert direkt in der URL, die eigene Bibliothek liegt lokal in
IndexedDB.

## Funktionsweise

Der Markdown-Quelltext wird per nativem `CompressionStream` (deflate-raw)
komprimiert und Base64-URL-kodiert in den Hash der URL geschrieben. Dadurch
bleiben die geteilten Links so kurz wie möglich (typischer Markdown-Text
schrumpft auf 30–50 % der Länge) und es wird kein Backend benötigt.

| URL | Ansicht |
| --- | --- |
| `…/#` | Startbildschirm: alle Arbeitsblätter mit Suche, Export und Import |
| `…/#d/<id>` | Editor für ein lokal (IndexedDB) gespeichertes Arbeitsblatt |
| `…/#e/<code>` | Geteiltes Dokument wird importiert und im Editor geöffnet |
| `…/#<code>` | Nur das gerenderte Arbeitsblatt, keine UI-Elemente — der Link für Schüler |

Der Editor speichert fortlaufend automatisch in IndexedDB. **Link teilen**
kopiert den reinen Anzeige-Link in die Zwischenablage.

## Funktionen

- **Startbildschirm** mit allen Arbeitsblättern, Volltextsuche, Export aller
  Blätter als JSON-Backup und Wiederherstellung daraus
- **Installierbare PWA** (Offline-fähig durch Service-Worker-Precache)
- **Light/Dark Mode** — folgt dem System, manuell umschaltbar
- **Tablet-optimiert und responsiv**: Split-View auf breiten Screens,
  Bearbeiten/Vorschau-Tabs auf schmalen; Touch-Ziele ≥ 44 px
- `.md`-Dateien öffnen und speichern

## Unterstütztes Markdown

- Überschriften, **fett**, *kursiv*, Listen, Zitate, Tabellen (GFM)
- KaTeX: inline `$x^2$` und display `$$…$$`
- Codeblöcke mit Syntax-Highlighting (highlight.js)
- Mermaid-Diagramme über ` ```mermaid `-Codeblöcke
- Online-Bilder: `![Beschreibung](https://…/bild.png)`
- Online-Videos über dieselbe Syntax: `![Titel](https://www.youtube.com/watch?v=…)`
  bettet YouTube (privacy-freundlich via youtube-nocookie) bzw. Vimeo ein,
  direkte `.mp4`/`.webm`-Links werden als Videoplayer gerendert
- **Funktionsplots** über ` ```plot `-Codeblöcke:

  ```plot
  f(x) = x^2 - 5x + 6
  g(x) = 0.5x - 1
  x: -1..7
  y: -3..8
  ```

  Mehrere Funktionen pro Diagramm, automatische Farben und Legende,
  `x:`/`y:` legen den Bereich fest (y sonst automatisch). Unterstützt
  `+ - * / ^`, Klammern, implizite Multiplikation (`2x`), `sin`, `cos`,
  `tan`, `sqrt`, `abs`, `ln`, `log`, `exp`, `pi`, `e`. Der Parser führt
  keinen Code aus (kein `eval`).

Das gerenderte HTML wird mit DOMPurify bereinigt; iframes sind nur für
YouTube/Vimeo erlaubt.

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal testen
```

Der Build ist eine rein statische Seite und kann auf jedem statischen Hosting
(GitHub Pages, Netlify, …) veröffentlicht werden.
