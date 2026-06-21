import { buildCatalogUpdateReviewViewModel, applyCatalogConflictResolution } from './catalogUpdateReviewViewModel';
import type { InventoryItem, Layout, TileType } from '../shared/types';

function tile(overrides: Partial<TileType> = {}): TileType {
  return {
    id: 'floor-1',
    name: 'Stone Floor',
    product_set: 'Starter Pack',
    dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
    faces: [
      {
        face_id: 'stone',
        face_name: 'Stone',
        role_tags: ['floor'],
        edge_sockets: [
          { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
          { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
          { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
          { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
        ],
        rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
        theme_tags: ['stone'],
      },
    ],
    catalog_status: 'official',
    category: 'floor',
    tags: ['starter'],
    catalog_version: '2026.06.01',
    ...overrides,
  };
}

function inventoryItem(tile_type_id: string): InventoryItem {
  return { tile_type_id, owned_quantity: 2, condition: 'good' };
}

function layoutWith(tile_type_id: string): Layout {
  return {
    id: `layout-${tile_type_id}`,
    placements: [{ tile_type_id, face_id: 'stone', x: 0, y: 0, rotation: 0, grid_cells: [{ x: 0, y: 0 }] }],
    seed: 'seed',
    goal: 'Make a tiny room',
    solver_version: 'solver-1',
    catalog_version: '2026.06.01',
    created_at: '2026-06-12T10:00:00.000Z',
  };
}

describe('catalog update review view model', () => {
  test('summarises added, removed, changed, and discontinued tiles with inventory and layout impact', () => {
    const current = [
      tile({ id: 'floor-1', name: 'Stone Floor', catalog_version: '2026.06.01' }),
      tile({ id: 'door-1', name: 'Door Arch', category: 'doorway', catalog_version: '2026.06.01' }),
      tile({ id: 'legacy-1', name: 'Legacy Alcove', catalog_version: '2026.06.01' }),
    ];
    const incoming = [
      tile({ id: 'floor-1', name: 'Stone Floor v2', notes: 'Updated socket metadata', catalog_version: '2026.07.01' }),
      tile({ id: 'door-1', name: 'Door Arch', category: 'doorway', catalog_status: 'deprecated', notes: 'Discontinued by publisher', catalog_version: '2026.07.01' }),
      tile({ id: 'wall-1', name: 'New Wall', category: 'wall', catalog_version: '2026.07.01' }),
    ];

    const model = buildCatalogUpdateReviewViewModel({
      currentTiles: current,
      incomingTiles: incoming,
      inventory: [inventoryItem('legacy-1'), inventoryItem('door-1')],
      savedLayouts: [layoutWith('legacy-1'), layoutWith('door-1')],
      catalogVersion: '2026.07.catalog',
    });

    expect(model.summaryCounts).toEqual({ added: 1, removed: 1, changed: 1, discontinued: 1, conflicts: 0 });
    expect(model.sections.map((section) => section.title)).toEqual([
      'New tiles',
      'Removed from update',
      'Metadata changed',
      'Discontinued tiles',
    ]);
    expect(model.sections[0].items[0].description).toBe('New Wall was added to the wall catalogue from 2026.07.01.');
    expect(model.sections[1].items[0]).toMatchObject({
      tileId: 'legacy-1',
      severity: 'warning',
      impact: 'You own 2 and have 1 saved layout placement using this tile. Existing inventory and layouts stay available with a warning badge.',
    });
    expect(model.sections[3].items[0]).toMatchObject({
      tileId: 'door-1',
      badge: 'Discontinued',
      impact: 'You own 2 and have 1 saved layout placement using this tile. Existing inventory and layouts stay available with a warning badge.',
    });
    expect(model.canAcceptUpdate).toBe(true);
  });

  test('explains newer schema requirements without silently accepting the update', () => {
    const model = buildCatalogUpdateReviewViewModel({
      currentTiles: [tile()],
      incomingTiles: [tile()],
      schemaVersion: 2,
      supportedSchemaVersion: 1,
      minimumAppVersion: '1.1',
    });

    expect(model.schemaWarning).toEqual({
      title: 'App update required',
      message: 'This pack requires TileKeeper v1.1 or later. Your current app supports catalog schema v1, but the pack uses v2.',
    });
    expect(model.canAcceptUpdate).toBe(false);
    expect(model.primaryActionLabel).toBe('Defer update');
  });

  test('flags custom tiles that collide with official IDs and exposes keep overwrite rename resolutions', () => {
    const custom = tile({ id: 'floor-1', name: 'My house-rule floor', catalog_status: 'custom', catalog_version: 'local' });
    const official = tile({ id: 'floor-1', name: 'Official Stone Floor', catalog_status: 'official', catalog_version: '2026.07.01' });

    const model = buildCatalogUpdateReviewViewModel({
      currentTiles: [custom],
      incomingTiles: [official],
    });

    expect(model.summaryCounts.conflicts).toBe(1);
    expect(model.conflicts[0]).toEqual({
      tileId: 'floor-1',
      customName: 'My house-rule floor',
      officialName: 'Official Stone Floor',
      message: 'Custom tile “My house-rule floor” uses official ID floor-1. Choose whether to keep it, overwrite it, or rename the custom tile before accepting.',
      choices: [
        { action: 'keep-custom', label: 'Keep custom tile' },
        { action: 'overwrite-with-official', label: 'Overwrite with official tile' },
        { action: 'rename-custom', label: 'Rename custom tile' },
      ],
      selectedAction: 'keep-custom',
    });
    expect(applyCatalogConflictResolution(model.conflicts[0], 'rename-custom')).toMatchObject({ selectedAction: 'rename-custom' });
  });
});
