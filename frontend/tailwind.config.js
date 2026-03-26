/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"Syne"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        atlas: {
          bg:       'var(--atlas-bg)',
          surface:  'var(--atlas-surface)',
          border:   'var(--atlas-border)',
          accent:   'var(--atlas-accent)',
          glow:     'var(--atlas-glow)',
          cyan:     'var(--atlas-cyan)',
          amber:    'var(--atlas-amber)',
          muted:    'var(--atlas-muted)',
          text:     'var(--atlas-text)',
          dim:      'var(--atlas-dim)',
        }
      },
      boxShadow: {
        'glow-blue': '0 0 24px rgba(37,99,235,0.35)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.25)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '48px 48px',
      }
    }
  },
  plugins: []
}
