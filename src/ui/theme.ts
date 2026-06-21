export const tileKeeperTheme = {
  colours: {
    background: '#FFF9E5',
    surface: '#FFFDF7',
    raisedSurface: '#F3E7C9',
    frame: '#1A1A1A',
    onFrame: '#FFFDF7',
    text: '#171414',
    mutedText: '#5E5A54',
    primary: '#800000',
    primaryPressed: '#6B1212',
    secondary: '#B8860B',
    secondaryBright: '#DAA520',
    border: '#C99731',
    focus: '#0072B2',
    success: '#009E73',
    warning: '#E69F00',
    danger: '#D55E00',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { button: 8, input: 8, card: 12, sheet: 16 },
  touch: { minimum: 44, preferredButtonHeight: 48 },
  typography: {
    title: { fontFamily: 'System', fontSize: 34, fontWeight: '900' as const, allowFontScaling: true },
    sectionHeader: { fontFamily: 'System', fontSize: 22, fontWeight: '800' as const, allowFontScaling: true },
    body: { fontFamily: 'System', fontSize: 16, fontWeight: '400' as const, allowFontScaling: true },
    label: { fontFamily: 'System', fontSize: 15, fontWeight: '700' as const, allowFontScaling: true },
    data: { fontFamily: 'monospace', fontSize: 13, fontWeight: '600' as const, allowFontScaling: true },
  },
} as const;

export type TileKeeperTheme = typeof tileKeeperTheme;

export function getAccessibleStateTreatment(state: 'selected' | 'success' | 'warning' | 'danger' | 'missing') {
  const treatments = {
    selected: { colour: tileKeeperTheme.colours.focus, icon: '◆', label: 'Selected' },
    success: { colour: tileKeeperTheme.colours.success, icon: '✓', label: 'Complete' },
    warning: { colour: tileKeeperTheme.colours.warning, icon: '!', label: 'Needs attention' },
    danger: { colour: tileKeeperTheme.colours.danger, icon: '×', label: 'Error' },
    missing: { colour: '#CC79A7', icon: '?', label: 'Missing tile' },
  } as const;

  return treatments[state];
}
