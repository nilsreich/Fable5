# Aufgabenblatt

Eine kleine Svelte-5-/Vite-8-App zum Erstellen und Teilen von Aufgabenblättern
als Markdown — komplett ohne Server und Datenbank: Das Dokument steckt
komprimiert direkt in der URL.

## Funktionsweise

Der Markdown-Quelltext wird per nativem `CompressionStream` (deflate-raw)
komprimiert und Base64-URL-kodiert in den Hash der URL geschrieben. Dadurch
bleiben die Links so kurz wie möglich (typischer Markdown-Text schrumpft auf
30–50 % der Länge) und es wird kein Backend benötigt.

| URL | Ansicht |
| --- | --- |
| `…/#<code>` | Nur das gerenderte Aufgabenblatt, keine UI-Elemente — zum Teilen mit Schülern |
| `…/#e/<code>` | Editor mit Live-Vorschau |
| `…/#e` oder `…/` | Editor mit Beispieldokument |

Der Editor schreibt den Stand fortlaufend in die URL (`#e/…`), ein Reload
verliert also nichts. **Link teilen** kopiert den reinen Anzeige-Link in die
Zwischenablage.

## Unterstütztes Markdown

- Überschriften, **fett**, *kursiv*, Listen, Zitate, Tabellen (GFM)
- KaTeX: inline `$x^2$` und display `$$…$$`
- Codeblöcke mit Syntax-Highlighting (highlight.js)
- Mermaid-Diagramme über ` ```mermaid `-Codeblöcke
- Online-Bilder: `![Beschreibung](https://…/bild.png)`
- Online-Videos über dieselbe Syntax: `![Titel](https://www.youtube.com/watch?v=…)`
  bettet YouTube (privacy-freundlich via youtube-nocookie) bzw. Vimeo ein,
  direkte `.mp4`/`.webm`-Links werden als Videoplayer gerendert

Das gerenderte HTML wird mit DOMPurify bereinigt; iframes sind nur für
YouTube/Vimeo erlaubt.

## Dateien laden und speichern

Über die Toolbar lassen sich `.md`-Dateien öffnen (📂) und der aktuelle Stand
als Markdown-Datei herunterladen (💾).

## Entwicklung

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal testen
```

Der Build ist eine rein statische Seite und kann auf jedem statischen Hosting
(GitHub Pages, Netlify, …) veröffentlicht werden.
