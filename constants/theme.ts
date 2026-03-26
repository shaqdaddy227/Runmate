export const COLORS = {
  // Backgrounds
  bg: '#070711',
  bgCard: '#0F0F1A',
  bgInput: '#13131F',
  bgOverlay: 'rgba(7, 7, 17, 0.85)',

  // Borders
  border: '#1A1A2E',
  borderLight: '#252540',

  // Brand - Neon Green (primary action, active state)
  primary: '#00F5A0',
  primaryDark: '#00C97A',
  primaryGlow: 'rgba(0, 245, 160, 0.2)',
  primaryDim: 'rgba(0, 245, 160, 0.08)',

  // Brand - Cyan (secondary, live indicators)
  secondary: '#00C9FF',
  secondaryGlow: 'rgba(0, 201, 255, 0.2)',
  secondaryDim: 'rgba(0, 201, 255, 0.08)',

  // Brand - Purple (accent, achievements)
  accent: '#8B5CF6',
  accentGlow: 'rgba(139, 92, 246, 0.2)',
  accentDim: 'rgba(139, 92, 246, 0.08)',

  // Semantic
  danger: '#FF4B5C',
  dangerGlow: 'rgba(255, 75, 92, 0.2)',
  warning: '#FFD700',
  success: '#00F5A0',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#4B5563',
  textDisabled: '#2D2D4A',

  // Heart rate
  heartRate: '#FF4B5C',
} as const;

export const GRADIENTS = {
  primary: ['#00F5A0', '#00C9FF'] as const,
  primaryReverse: ['#00C9FF', '#00F5A0'] as const,
  accent: ['#8B5CF6', '#00C9FF'] as const,
  danger: ['#FF4B5C', '#FF8C69'] as const,
  card: ['rgba(15,15,26,0.9)', 'rgba(15,15,26,0.6)'] as const,
  screenFade: ['transparent', 'rgba(7,7,17,0.96)', '#070711'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  h3: 28,
  h2: 34,
  h1: 42,
  display: 72,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const SHADOWS = {
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  }),
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a14' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555577' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a14' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#131322' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#7777aa' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#8888bb' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#4a4a6a' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d1a0d' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#225522' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d0d1a' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#3a3a5a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#222235' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#14141e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#131325' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#4a4a6a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#040410' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1a1a3a' }] },
];
