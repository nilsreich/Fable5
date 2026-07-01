// Light/Dark Mode: folgt dem System, manuell umschaltbar, Wahl wird gemerkt.

function initial() {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const theme = $state({ current: initial() })

function apply() {
  document.documentElement.dataset.theme = theme.current
}

apply()

export function toggleTheme() {
  theme.current = theme.current === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', theme.current)
  apply()
}
