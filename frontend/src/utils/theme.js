export const FONTS = [
  {
    id: 'arial',
    label: 'Arial — Default Sans',
    value: 'Arial, Helvetica, sans-serif',
    preview: 'Clean & Professional',
  },
  {
    id: 'helvetica',
    label: 'Helvetica — Clean Sans',
    value: 'Helvetica, Arial, sans-serif',
    preview: 'Crisp & Modern',
  },
  {
    id: 'times',
    label: 'Times New Roman — Serif',
    value: "'Times New Roman', Times, serif",
    preview: 'Classic & Editorial',
  },
];

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('alumniconnect_theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('alumniconnect_theme', theme);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('alumniconnect:theme-change', { detail: theme }));
  }
}

export function getInitialFont() {
  if (typeof window === 'undefined') return 'arial';
  const saved = localStorage.getItem('alumniconnect_font');
  if (saved === 'helvetica' || saved === 'times' || saved === 'arial') return saved;
  // All other/legacy font keys strictly fallback to 'arial'
  return 'arial';
}

export function applyFont(fontId) {
  if (typeof document === 'undefined') return;
  const found = FONTS.find((f) => f.id === fontId) || FONTS[0];
  document.documentElement.style.setProperty('--app-font-family', found.value);
  document.documentElement.style.setProperty('--app-font', found.value);
  document.documentElement.style.setProperty('--heading-font', found.value);
  document.documentElement.setAttribute('data-font', found.id);
  localStorage.setItem('alumniconnect_font', found.id);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('alumniconnect:font-change', { detail: found.id }));
  }
}
