import { getRouteById, tileKeeperRoutes } from './navigation';
import { getAccessibleStateTreatment, tileKeeperTheme } from './theme';

describe('TileKeeper UI shell navigation and theming', () => {
  test('declares the required Expo Router shell screens in user-task order', () => {
    expect(tileKeeperRoutes.map((route) => route.id)).toEqual([
      'home',
      'inventory',
      'layout-goal',
      'preview',
      'saved-layouts',
      'export',
      'settings',
    ]);
    expect(tileKeeperRoutes.every((route) => route.localFirst)).toBe(true);
  });

  test('uses the Modular Realms parchment, oxblood, brass, and charcoal theme', () => {
    expect(tileKeeperTheme.colours.background).toBe('#FFF9E5');
    expect(tileKeeperTheme.colours.primary).toBe('#800000');
    expect(tileKeeperTheme.colours.secondary).toBe('#B8860B');
    expect(tileKeeperTheme.colours.frame).toBe('#1A1A1A');
    expect(tileKeeperTheme.touch.minimum).toBeGreaterThanOrEqual(44);
  });

  test('state treatments include icon and label so colour is never the only signal', () => {
    expect(getAccessibleStateTreatment('warning')).toEqual({
      colour: '#E69F00',
      icon: '!',
      label: 'Needs attention',
    });
    expect(getRouteById('export').path).toBe('/export');
  });
});
