/**
 * Tokens de diseño – propuesta D "Pop Noche".
 * Fuente de verdad en TypeScript. Los valores de color por tema se replican en theme.css
 * (variables CSS) para que el cambio claro/oscuro no requiera recompilar Tailwind.
 */

export type ThemeName = 'light' | 'dark';

/** Colores que cambian según el tema. */
export const themeColors = {
  light: {
    bg: '#FFF8FC',
    surface: '#FFFFFF',
    track: '#EFE7FF',
    ink: '#1B1033',
    muted: '#4A3F66',
    outline: '#1B1033',
    shadow: '#1B1033',
    pink: '#FF6FB5',
    purple: '#5B2BD1',
    link: '#5B2BD1',
    navbg: '#FFFFFF',
  },
  dark: {
    bg: '#150E26',
    surface: '#211638',
    track: '#3A2A63',
    ink: '#F6F2FF',
    muted: '#B8AAD6',
    outline: '#A78BFA',
    shadow: '#5B2BD1',
    pink: '#FF7AC0',
    purple: '#A78BFA',
    link: '#D3C4FF',
    navbg: '#1A1030',
  },
} as const;

/** Colores fijos: iguales en ambos temas. */
export const fixedColors = {
  /** Banda morada superior de cada pantalla. */
  band: '#5B2BD1',
  bandAccent: '#7A4BEA',
  bandDeep: '#4A20B0',
  bandText: '#E4D8FF',
  /** Texto sobre rosado y sobre stickers de semáforo (contraste alto). */
  onPink: '#1B1033',
  /** Anillo de Disponible real dentro de la banda. */
  ringSpent: '#FFFFFF',
  ringSaved: '#FF8FCB',
  /** Semáforo de compra. Siempre acompañado de ícono y texto. */
  semaphore: {
    green: '#7EE0A4', // Comprable hoy
    yellow: '#FFE08A', // Falta poco
    red: '#FF9AA2', // Fuera de presupuesto
  },
} as const;

export const fonts = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
  /** Enlace de Google Fonts para cargar ambas familias. */
  googleFontsHref:
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@500;600;700&display=swap',
} as const;

export const radii = {
  chip: '10px',
  button: '18px',
  card: '22px',
  band: '36px',
  pill: '9999px',
} as const;

export const borders = {
  /** Grosor del borde de tarjetas, botones y stickers. */
  width: '2px',
  /** Sombra dura con desplazamiento, sin desenfoque. */
  shadowOffset: '4px 4px 0',
} as const;

export const spacing = {
  screenPadding: '20px',
  navHeight: '84px',
  /** Alto mínimo de elementos táctiles. */
  touchTarget: '44px',
} as const;
