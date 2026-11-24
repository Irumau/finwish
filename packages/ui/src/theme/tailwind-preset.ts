import type { Config } from 'tailwindcss';

/**
 * Preset de Tailwind compartido por expenses-web y wishlist-web.
 * Uso en cada app:
 *   import preset from '@finwish/ui/theme/tailwind-preset';
 *   export default { presets: [preset], content: ['./index.html', './src/**\/*.{ts,tsx}'] };
 * Los colores apuntan a variables CSS (theme.css), por lo que cambian solos con el tema.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        track: 'var(--color-track)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        outline: 'var(--color-outline)',
        brand: {
          pink: 'var(--color-pink)',
          purple: 'var(--color-purple)',
          link: 'var(--color-link)',
        },
        nav: 'var(--color-navbg)',
        band: {
          DEFAULT: 'var(--color-band)',
          accent: 'var(--color-band-accent)',
          deep: 'var(--color-band-deep)',
          text: 'var(--color-band-text)',
        },
        'on-pink': 'var(--color-on-pink)',
        semaphore: {
          green: 'var(--color-semaphore-green)',
          yellow: 'var(--color-semaphore-yellow)',
          red: 'var(--color-semaphore-red)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        chip: 'var(--radius-chip)',
        button: 'var(--radius-button)',
        card: 'var(--radius-card)',
        band: 'var(--radius-band)',
      },
      borderWidth: {
        pop: 'var(--border-width)',
      },
      boxShadow: {
        // Sombra dura característica del estilo Pop.
        pop: '4px 4px 0 var(--color-shadow)',
        'pop-sm': '3px 3px 0 var(--color-shadow)',
      },
      spacing: {
        nav: '84px',
      },
      minHeight: {
        touch: '44px',
      },
    },
  },
};

export default preset;
