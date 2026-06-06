import type { InventoryItem, TileType } from '../shared/types';
import { suggestMissingTiles } from './missingTileSuggestions';

function tile(
  id: string,
  category: TileType['category'],
  options: { name?: string; tags?: string[]; themeTags?: string[]; roleTags?: string[] } = {},
): TileType {
  return {
    id,
    name: options.name ?? id,
    product_set: 'Suggestion Test Pack',
    dimensions: {
      unit: 'grid-cell',
      width: 1,
      height: 1,
      grid_cells: [{ x: 0, y: 0 }],
    },
    faces: [
      {
        face_id: 'front',
        face_name: 'Front',
        role_tags: options.roleTags ?? [category],
        edge_sockets: [
          { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'test' },
          { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'test' },
          { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'test' },
          { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'test' },
        ],
        rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
        theme_tags: options.themeTags ?? [],
      },
    ],
    catalog_status: 'official',
    category,
    tags: options.tags ?? [],
    catalog_version: 'test',
  };
}

const inventory = (tile_type_id: string, owned_quantity: number, reserved = 0): InventoryItem => ({
  tile_type_id,
  owned_quantity,
  reserved,
  condition: 'good',
});

describe('missing tile suggestion engine', () => {
  test('suggests the exact required tile type when owned inventory is short', () => {
    const catalog = [tile('boss-room', 'floor', { name: 'Boss Room', themeTags: ['dungeon'] })];

    expect(
      suggestMissingTiles({
        catalog,
        inventory: [inventory('boss-room', 1)],
        requiredTileTypeIds: ['boss-room', 'boss-room', 'boss-room'],
      }),
    ).toEqual([
      {
        tile_type_id: 'boss-room',
        name: 'Boss Room',
        category: 'floor',
        missing_quantity: 2,
        reason: 'required-tile-type-shortage',
        matched_theme_tags: [],
        score: 2000,
      },
    ]);
  });

  test('suggests deterministic themed category candidates after subtracting available owned tiles', () => {
    const catalog = [
      tile('plain-floor', 'floor', { name: 'Plain Floor', themeTags: ['stone'] }),
      tile('crypt-floor', 'floor', { name: 'Crypt Floor', themeTags: ['crypt', 'stone'] }),
      tile('crypt-door', 'doorway', { name: 'Crypt Door', themeTags: ['crypt'] }),
    ];

    expect(
      suggestMissingTiles({
        catalog,
        inventory: [inventory('plain-floor', 1), inventory('crypt-door', 1, 1)],
        requiredCategories: [{ category: 'floor', quantity: 3 }],
        themeTags: ['crypt'],
      }),
    ).toEqual([
      {
        tile_type_id: 'crypt-floor',
        name: 'Crypt Floor',
        category: 'floor',
        missing_quantity: 2,
        reason: 'required-category-shortage',
        matched_theme_tags: ['crypt'],
        score: 1201,
      },
    ]);
  });

  test('reports an unsuggestable requirement when the catalog has no matching candidate', () => {
    expect(
      suggestMissingTiles({
        catalog: [tile('plain-floor', 'floor')],
        inventory: [],
        requiredCategories: [{ category: 'doorway', quantity: 1 }],
      }),
    ).toEqual([
      {
        tile_type_id: null,
        name: 'Missing doorway tile',
        category: 'doorway',
        missing_quantity: 1,
        reason: 'no-catalog-candidate',
        matched_theme_tags: [],
        score: 0,
      },
    ]);
  });
});
