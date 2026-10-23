// Design tokens from the wireframe's design system (wireframe/WF_reference.html, "Design system" page).
export const colors = {
  bg: '#09090B',
  bg2: '#111114',
  card: '#17171B',
  cardHover: '#1C1C21',
  border: '#27272A',
  borderStrong: '#3F3F46',
  text: '#FAFAFA',
  text2: '#A1A1AA',
  text3: '#85858F',
  accent: '#7B80F0',
  accentText: '#A9ADF7',
  positive: '#3DB68A',
  negative: '#E5636A',
  warning: '#D4A24C',
} as const;

export const radius = { sm: 6, md: 8, lg: 12 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const fontSize = { caption: 12, body: 14, heading: 14, title: 20, value: 22, hero: 34 } as const;

export const fontWeight = { regular: '400', medium: '500', semibold: '600' } as const;
