import {
  edgeSocketSchema,
  inventoryItemSchema,
  layoutSchema,
  tileTypeSchema,
} from './schemas';
import type { Layout, TileType } from './types';

const doubleSidedTile: TileType = {
  id: 'tile-floor-2x2-double-sided',
  name: 'Wood / Cracked Stone Floor',
  product_set: '20 1x1 tiles',
  dimensions: {
    unit: 'grid-cell',
    width: 2,
    height: 2,
    grid_cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  faces: [
    {
      face_id: 'face-wood',
      face_name: 'Wood',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
      theme_tags: ['wood', 'floor'],
    },
    {
      face_id: 'face-cracked-stone',
      face_name: 'Cracked Stone',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to adjacent floor tiles' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
      theme_tags: ['cracked-stone', 'floor'],
    },
  ],
  catalog_status: 'official',
  category: 'floor',
  tags: ['double-sided', 'starter'],
  catalog_version: '2026.06.03',
  notes: 'Real Modular Realms double-sided 2x2 floor tile for schema validation.',
};

describe('TileKeeper shared schemas', () => {
  test('round-trips a representative double-sided physical tile through JSON', () => {
    const parsed = tileTypeSchema.parse(JSON.parse(JSON.stringify(doubleSidedTile)));

    expect(parsed).toEqual(doubleSidedTile);
    expect(parsed.faces).toHaveLength(2);
    expect(parsed.faces.map((face) => face.face_id)).toEqual(['face-wood', 'face-cracked-stone']);
  });

  test('keeps inventory at physical tile level and rejects face-level inventory', () => {
    const item = inventoryItemSchema.parse({
      tile_type_id: doubleSidedTile.id,
      owned_quantity: 2,
      condition: 'good',
      notes: 'Stored with starter box.',
      storage_location: 'Shelf A / starter tray',
    });

    expect(item.tile_type_id).toBe(doubleSidedTile.id);
    expect(() =>
      inventoryItemSchema.parse({
        tile_type_id: doubleSidedTile.id,
        face_id: 'corridor-a',
        owned_quantity: 1,
        condition: 'good',
      }),
    ).toThrow();
  });

  test('round-trips a layout with placements, rotations, grid cells, and catalog metadata', () => {
    const layout: Layout = {
      id: 'layout-demo-seed-001',
      placements: [
        {
          tile_type_id: doubleSidedTile.id,
          face_id: 'corridor-a',
          x: 4,
          y: 7,
          rotation: 180,
          grid_cells: [
            { x: 4, y: 7 },
            { x: 5, y: 7 },
            { x: 6, y: 7 },
          ],
        },
      ],
      seed: 'demo-seed-001',
      goal: 'Build a simple straight corridor demo.',
      solver_version: 'solver-m2-sp1',
      catalog_version: '2026.06.03',
      created_at: '2026-06-03T10:40:00.000Z',
    };

    expect(layoutSchema.parse(JSON.parse(JSON.stringify(layout)))).toEqual(layout);
  });

  test('requires edge compatibility evidence with side, socket type, bidirectionality, and reason', () => {
    expect(
      edgeSocketSchema.parse({
        face: 'north',
        socket_type: 'doorway',
        bidirectional: true,
        reason: 'doorway aligns with another doorway/open room edge',
      }),
    ).toEqual({
      face: 'north',
      socket_type: 'doorway',
      bidirectional: true,
      reason: 'doorway aligns with another doorway/open room edge',
    });

    expect(() => edgeSocketSchema.parse({ face: 'north', socket_type: 'doorway', bidirectional: true })).toThrow();
  });
});
