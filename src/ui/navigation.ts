export type TileKeeperRouteId = 'home' | 'inventory' | 'layout-goal' | 'preview' | 'saved-layouts' | 'export' | 'settings';

export interface TileKeeperRoute {
  id: TileKeeperRouteId;
  path: '/' | '/inventory' | '/layout-goal' | '/preview' | '/saved-layouts' | '/export' | '/settings';
  label: string;
  description: string;
  icon: string;
  localFirst: boolean;
}

export const tileKeeperRoutes: TileKeeperRoute[] = [
  { id: 'home', path: '/', label: 'Home', description: 'Mission control for terrain prep.', icon: '⌂', localFirst: true },
  { id: 'inventory', path: '/inventory', label: 'Inventory', description: 'Search, filter, add, and edit owned tile quantities.', icon: '▦', localFirst: true },
  { id: 'layout-goal', path: '/layout-goal', label: 'Layout Goal', description: 'Set table bounds, target tiles, constraints, and deterministic seed.', icon: '✦', localFirst: true },
  { id: 'preview', path: '/preview', label: 'Preview', description: 'Inspect schematic layouts with tile labels, rotations, faces, and warnings.', icon: '◎', localFirst: true },
  { id: 'saved-layouts', path: '/saved-layouts', label: 'Saved Layouts', description: 'Reopen, duplicate, tag, favourite, and annotate plans.', icon: '★', localFirst: true },
  { id: 'export', path: '/export', label: 'Export & Backup', description: 'Share JSON, PNG, PDF, and encrypted backup envelopes.', icon: '⇪', localFirst: true },
  { id: 'settings', path: '/settings', label: 'Settings', description: 'Theme, backup links, catalog refresh, offline status, and about.', icon: '⚙', localFirst: true },
];

export function getRouteById(id: TileKeeperRouteId): TileKeeperRoute {
  const route = tileKeeperRoutes.find((candidate) => candidate.id === id);
  if (!route) {
    throw new Error(`Unknown TileKeeper route: ${id}`);
  }
  return route;
}
