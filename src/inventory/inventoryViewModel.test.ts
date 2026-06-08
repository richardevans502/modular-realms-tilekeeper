import { filterInventoryRows, mergeCatalogWithInventory, toInventoryRows } from './inventoryViewModel';
import type { InventoryDetail } from '../db/inventoryRepository';
import type { TileType } from '../shared/types';

const floorTile: TileType = {
  id: 'mr-floor-1x1',
  name: '1x1 Stone Floor',
  product_set: 'Core Set',
  dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
  faces: [
    {
      face_id: 'stone-a',
      face_name: 'Stone A',
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
  catalog_version: '2026.06.03',
};

const unknownTileDetail: InventoryDetail = {
  item: {
    tile_type_id: 'custom-missing-ref',
    owned_quantity: 2,
    reserved: 0,
    condition: 'unknown',
    storage_location: 'loose tray',
  },
  tile: null,
  available_quantity: 2,
};

const details: InventoryDetail[] = [
  {
    item: {
      tile_type_id: floorTile.id,
      owned_quantity: 5,
      reserved: 1,
      condition: 'good',
      notes: 'demo count',
      storage_location: 'core box',
    },
    tile: floorTile,
    available_quantity: 4,
  },
  unknownTileDetail,
];

describe('inventory UI view model', () => {
  test('maps repository details into rows suitable for the inventory skeleton', () => {
    expect(toInventoryRows(details)).toEqual([
      {
        id: 'mr-floor-1x1',
        title: '1x1 Stone Floor',
        subtitle: 'Core Set · floor · core box',
        owned_quantity: 5,
        reserved: 1,
        available_quantity: 4,
        condition: 'good',
        notes: 'demo count',
        storage_location: 'core box',
      },
      {
        id: 'custom-missing-ref',
        title: 'custom-missing-ref',
        subtitle: 'Unmatched catalog tile · loose tray',
        owned_quantity: 2,
        reserved: 0,
        available_quantity: 2,
        condition: 'unknown',
        notes: undefined,
        storage_location: 'loose tray',
      },
    ]);
  });

  test('filters rows by search text and condition for skeleton search/filter controls', () => {
    const rows = toInventoryRows(details);

    expect(filterInventoryRows(rows, { searchText: 'stone', condition: 'all' }).map((row) => row.id)).toEqual([
      'mr-floor-1x1',
    ]);
    expect(filterInventoryRows(rows, { searchText: '', condition: 'unknown' }).map((row) => row.id)).toEqual([
      'custom-missing-ref',
    ]);
    expect(filterInventoryRows(rows, { searchText: 'tray', condition: 'good' })).toEqual([]);
  });

  test('mergeCatalogWithInventory shows all catalog tiles including zero-owned', () => {
    const merged = mergeCatalogWithInventory([floorTile], [details[0]]);
    expect(merged).toHaveLength(1);
    expect(merged[0].item.owned_quantity).toBe(5);

    const mergedZero = mergeCatalogWithInventory([floorTile], []);
    expect(mergedZero).toHaveLength(1);
    expect(mergedZero[0].item.owned_quantity).toBe(0);
    expect(mergedZero[0].item.condition).toBe('unknown');
  });
});
