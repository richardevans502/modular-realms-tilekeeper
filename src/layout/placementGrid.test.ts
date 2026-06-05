import type { LayoutPlacement, TileType } from '../shared/types';
import {
  buildPlacement,
  canPlaceOnGrid,
  createPlacementGrid,
  getOccupiedCells,
  isLayoutConnected,
  placeOnGrid,
  validateSocketCompatibility,
} from './placementGrid';

const baseTile: TileType = {
  id: 'tile-room-2x3',
  name: 'Room 2x3',
  product_set: 'Test Pack',
  dimensions: {
    unit: 'grid-cell',
    width: 2,
    height: 3,
    grid_cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },
  faces: [
    {
      face_id: 'room-a',
      face_name: 'Room A',
      role_tags: ['room'],
      edge_sockets: [
        { face: 'north', socket_type: 'wall', bidirectional: true, reason: 'test wall edge' },
        { face: 'east', socket_type: 'doorway', bidirectional: true, reason: 'test doorway edge' },
        { face: 'south', socket_type: 'wall', bidirectional: true, reason: 'test wall edge' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'test open edge' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
      theme_tags: ['test'],
    },
  ],
  catalog_status: 'custom',
  category: 'floor',
  tags: ['test'],
  catalog_version: 'test',
};

const existingPlacement: LayoutPlacement = {
  tile_type_id: 'existing',
  face_id: 'existing-face',
  x: 0,
  y: 0,
  rotation: 0,
  grid_cells: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ],
};

describe('placement grid phase 0', () => {
  test('rotates a dimension-aware rectangular footprint around its local origin and anchors it on the grid', () => {
    expect(getOccupiedCells(baseTile.dimensions, { x: 10, y: 20 }, 90)).toEqual([
      { x: 12, y: 20 },
      { x: 12, y: 21 },
      { x: 11, y: 20 },
      { x: 11, y: 21 },
      { x: 10, y: 20 },
      { x: 10, y: 21 },
    ]);
  });

  test('builds a layout placement with selected face, rotation, anchor, and occupied cells', () => {
    expect(buildPlacement(baseTile, 'room-a', { x: 2, y: 3 }, 0)).toEqual({
      tile_type_id: 'tile-room-2x3',
      face_id: 'room-a',
      x: 2,
      y: 3,
      rotation: 0,
      grid_cells: [
        { x: 2, y: 3 },
        { x: 3, y: 3 },
        { x: 2, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
      ],
    });
  });

  test('rejects placements that collide with occupied cells or exceed table bounds', () => {
    const grid = createPlacementGrid({ width: 4, height: 4 }, [existingPlacement]);
    const overlapping = buildPlacement(baseTile, 'room-a', { x: 1, y: 0 }, 0);
    const outsideBounds = buildPlacement(baseTile, 'room-a', { x: 3, y: 2 }, 0);

    expect(canPlaceOnGrid(grid, overlapping)).toEqual({
      ok: false,
      reason: 'collision',
      cells: [{ x: 1, y: 0 }],
    });
    expect(canPlaceOnGrid(grid, outsideBounds)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
      cells: [
        { x: 4, y: 2 },
        { x: 4, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 4 },
      ],
    });
  });

  test('places adjacent non-overlapping tiles and indexes occupied cells deterministically', () => {
    const grid = createPlacementGrid({ width: 6, height: 4 }, [existingPlacement]);
    const adjacent = buildPlacement(baseTile, 'room-a', { x: 2, y: 0 }, 90);

    expect(canPlaceOnGrid(grid, adjacent)).toEqual({ ok: true });

    const next = placeOnGrid(grid, adjacent);
    expect(next.placements.map((placement) => placement.tile_type_id)).toEqual(['existing', 'tile-room-2x3']);
    expect(next.occupiedCells).toEqual([
      { key: '0,0', placementIndex: 0 },
      { key: '1,0', placementIndex: 0 },
      { key: '2,0', placementIndex: 1 },
      { key: '2,1', placementIndex: 1 },
      { key: '3,0', placementIndex: 1 },
      { key: '3,1', placementIndex: 1 },
      { key: '4,0', placementIndex: 1 },
      { key: '4,1', placementIndex: 1 },
    ]);
  });

  test('rejects unknown faces and disallowed rotations before grid mutation', () => {
    const lockedTile: TileType = {
      ...baseTile,
      faces: [
        {
          ...baseTile.faces[0],
          rotation_rules: { allowed_rotations: [0], flip_allowed: false },
        },
      ],
    };

    expect(() => buildPlacement(baseTile, 'missing-face', { x: 0, y: 0 }, 0)).toThrow("Face 'missing-face' not found");
    expect(() => buildPlacement(lockedTile, 'room-a', { x: 0, y: 0 }, 90)).toThrow('Rotation 90 is not allowed');
  });
});

function singleCellTile(id: string, sockets: Record<'north' | 'east' | 'south' | 'west', 'wall' | 'open-floor' | 'doorway'>): TileType {
  return {
    id,
    name: id,
    product_set: 'Socket Test Pack',
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
        role_tags: ['room'],
        edge_sockets: (['north', 'east', 'south', 'west'] as const).map((face) => ({
          face,
          socket_type: sockets[face],
          bidirectional: true,
          reason: `${face} ${sockets[face]}`,
        })),
        rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
        theme_tags: ['test'],
      },
    ],
    catalog_status: 'custom',
    category: 'floor',
    tags: ['test'],
    catalog_version: 'test',
  };
}

const doorwayTile = singleCellTile('doorway-room', {
  north: 'wall',
  east: 'doorway',
  south: 'wall',
  west: 'doorway',
});

const wallTile = singleCellTile('wall-room', {
  north: 'wall',
  east: 'wall',
  south: 'wall',
  west: 'wall',
});

describe('placement grid phase 1 socket compatibility and connectedness', () => {
  test('flags adjacent placements when touching sockets do not match', () => {
    const grid = createPlacementGrid({ width: 3, height: 1 }, [
      buildPlacement(doorwayTile, 'front', { x: 0, y: 0 }, 0),
      buildPlacement(wallTile, 'front', { x: 1, y: 0 }, 0),
    ]);

    expect(validateSocketCompatibility(grid, [doorwayTile, wallTile])).toEqual({
      ok: false,
      reason: 'socket-incompatibility',
      issues: [
        {
          fromPlacementIndex: 0,
          toPlacementIndex: 1,
          fromCell: { x: 0, y: 0 },
          toCell: { x: 1, y: 0 },
          fromFace: 'east',
          toFace: 'west',
          fromSocket: 'doorway',
          toSocket: 'wall',
        },
      ],
    });
  });

  test('accepts matching doorway sockets and treats them as a traversable connected layout edge', () => {
    const grid = createPlacementGrid({ width: 2, height: 1 }, [
      buildPlacement(doorwayTile, 'front', { x: 0, y: 0 }, 0),
      buildPlacement(doorwayTile, 'front', { x: 1, y: 0 }, 0),
    ]);

    expect(validateSocketCompatibility(grid, [doorwayTile])).toEqual({ ok: true });
    expect(isLayoutConnected(grid, [doorwayTile])).toBe(true);
  });

  test('requires every placement to be connected through compatible non-wall sockets', () => {
    const grid = createPlacementGrid({ width: 4, height: 1 }, [
      buildPlacement(doorwayTile, 'front', { x: 0, y: 0 }, 0),
      buildPlacement(doorwayTile, 'front', { x: 1, y: 0 }, 0),
      buildPlacement(wallTile, 'front', { x: 3, y: 0 }, 0),
    ]);

    expect(validateSocketCompatibility(grid, [doorwayTile, wallTile])).toEqual({ ok: true });
    expect(isLayoutConnected(grid, [doorwayTile, wallTile])).toBe(false);
  });
});
