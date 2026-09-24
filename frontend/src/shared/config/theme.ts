/**
 * Design tokens do ConnectaDev.
 * Fonte da verdade: docs/identidade-visual/Identidade_Visual.md (seções 3.3, 4.2 e 6.1).
 * Toda cor, fonte, raio ou sombra usada em StyleSheet deve vir daqui.
 */

export const colors = {
  // Cores institucionais
  primary: '#036564', // Emerald Teal — CTAs, nós ativos, progresso, links
  primaryHover: '#025251',
  primaryActive: '#01403f',
  secondary: '#033649', // Deep Petróleo — headers, títulos H2, rodapés
  secondaryHover: '#022735',
  secondaryActive: '#011d27',
  dark: '#031634', // Midnight Navy — fundo dark, texto de alto contraste
  accent: '#cdb380', // Gold Sand — XP, badges, destaques
  light: '#e8ddcb', // Soft Cream — cards, fundos de fórum, bordas suaves
  lightActive: '#ddcfb9',
  creamSoft: '#F4EFE6', // Soft Cream a ~50% — fundo de cards de destaque e botões "soft"
  accentSoft: '#F3E9D2', // Gold Sand claro — fundo de ícones de badges

  // Superfícies
  canvas: '#F9F8F5',
  surface: '#FFFFFF',
  canvasDark: '#031634',
  surfaceDark: '#07224d',

  // Texto
  textPrimary: '#031634',
  textBody: '#222222',
  textMuted: '#6B6560',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Feedback
  success: '#198754',
  warning: '#cdb380',
  danger: '#d9534f',
  info: '#036564',
} as const;

export const fonts = {
  sans: {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  mono: {
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
  },
} as const;

// Escala mobile da seção 4.2
export const typography = {
  h1: { fontFamily: fonts.sans.bold, fontSize: 26, color: colors.textPrimary },
  h2: { fontFamily: fonts.sans.semiBold, fontSize: 20, color: colors.secondary },
  h3: { fontFamily: fonts.sans.semiBold, fontSize: 16, color: colors.primary },
  body: { fontFamily: fonts.sans.regular, fontSize: 14, color: colors.textBody },
  caption: { fontFamily: fonts.sans.regular, fontSize: 12, color: colors.textMuted },
  code: { fontFamily: fonts.mono.medium, fontSize: 12, color: colors.secondary },
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  pill: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// --cdev-shadow-card: 0 4px 12px rgba(3, 22, 52, 0.08)
export const shadow = {
  card: {
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const theme = { colors, fonts, typography, radius, spacing, shadow } as const;

export type Theme = typeof theme;
