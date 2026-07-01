import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  // relative Pfade, damit der Build auf jedem statischen Hosting
  // (auch unter einem Unterpfad wie GitHub Pages) funktioniert
  base: './',
  plugins: [svelte()],
})
