import type { Layout, TileType } from '../shared/types';
import {
  buildLayoutPreviewScreenModel,
  inspectTileAtGridCell,
  panLayoutPreview,
  selectTileByPlacementIndex,
  zoomLayoutPreview,
} from './layoutPreviewScreenModel';

const roomTile: TileType = {
  id: 'room-2x1',
  name: 'Vault Room',
  product_set: 'Starter Vaults',
  dimensions: {
    unit: 'grid-cell',
    width: 2,
    height: 1,
    grid_cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
  },
  faces: [
    {
      face_id: 'front',
      face_name: 'Gold Vault',
      role_tags: ['room'],
      edge_sockets: [
        { face: 'north', socket_type: 'wall', bidirectional: true, reason: 'solid wall' },
        { face: 'east', socket_type: 'doorway', bidirectional: true, reason: 'doorway transition' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
      theme_tags: ['gold'],
    },
  ],
  catalog_status: 'official',
  category: 'floor',
  tags: ['room'],
  catalog_version: 'test',
};

const stairTile: TileType = {
  id: 'stair-1x1',
  name: 'Secret Stair',
  product_set: 'Starter Vaults',
  dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
  faces: [
    {
      face_id: 'top',
      face_name: 'Trapdoor',
      role_tags: ['transition'],
      edge_sockets: [{ face: 'west', socket_type: 'doorway', bidirectional: true, reason: 'joins room' }],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
      theme_tags: ['stone'],
    },
  ],
  catalog_status: 'official',
  category: 'doorway',
  tags: ['stair'],
  catalog_version: 'test',
};

const layout: Layout = {
  id: 'layout-preview-test',
  seed: 'preview-seed',
  goal: 'inspect the generated vault',
  solver_version: 'solver-test',
  catalog_version: 'test',
  created_at: '2026-06-07T00:00:00.000Z',
  placements: [
    {
      tile_type_id: 'room-2x1',
      face_id: 'front',
      x: 0,
      y: 0,
      rotation: 0,
      grid_cells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    },
    {
      tile_type_id: 'stair-1x1',
      face_id: 'top',
      x: 2,
      y: 0,
      rotation: 90,
      grid_cells: [{ x: 2, y: 0 }],
    },
  ],
};

const catalog = [roomTile, stairTile];

describe('layout preview screen model', () => {
  test('builds schematic grid viewport state with category legend and socket compatibility', () => {
    const model = buildLayoutPreviewScreenModel(layout, catalog, {
      viewportWidth: 320,
      viewportHeight: 240,
      pan: { x: 24, y: -12 },
      zoom: 1.5,
    });

    expect(model.title).toBe('Layout Preview');
    expect(model.layoutSummary).toEqual({ id: 'layout-preview-test', goal: 'inspect the generated vault', placementCount: 2 });
    expect(model.viewport).toEqual({ width: 320, height: 240, pan: { x: 24, y: -12 }, zoom: 1.5 });
    expect(model.contentTransform).toEqual({ translateX: 24, translateY: -12, scale: 1.5 });
    expect(model.schematic.tiles.map((tile) => tile.label)).toEqual(['Vault Room', 'Secret Stair']);
    expect(model.schematic.tiles.map((tile) => tile.category)).toEqual(['floor', 'doorway']);
    expect(model.legend).toEqual([
      { category: 'floor', color: '#7dd3fc', label: 'Floor' },
      { category: 'doorway', color: '#fde68a', label: 'Doorway' },
    ]);
    expect(model.schematic.tiles.flatMap((tile) => tile.sockets).map((socket) => socket.compatibility)).toEqual([
      'compatible',
      'incompatible',
      'incompatible',
    ]);
    expect(model.selectedTile).toBeNull();
  });

  test('clamps pan and zoom gestures to screen-safe bounds', () => {
    const initial = buildLayoutPreviewScreenModel(layout, catalog, { viewportWidth: 320, viewportHeight: 240 });
    const panned = panLayoutPreview(initial.viewport, { x: 999, y: -999 });
    const zoomedIn = zoomLayoutPreview(panned, 20);
    const zoomedOut = zoomLayoutPreview(zoomedIn, 0.01);

    expect(panned.pan).toEqual({ x: 320, y: -240 });
    expect(zoomedIn.zoom).toBe(3);
    expect(zoomedOut.zoom).toBe(0.5);
  });

  test('inspects a tile from a grid coordinate and exposes catalog details', () => {
    const model = inspectTileAtGridCell(layout, catalog, { x: 2, y: 0 });

    expect(model?.selectedTile).toEqual({
      placementIndex: 1,
      tileTypeId: 'stair-1x1',
      tileName: 'Secret Stair',
      faceId: 'top',
      faceName: 'Trapdoor',
      category: 'doorway',
      productSet: 'Starter Vaults',
      rotation: 90,
      occupiedCells: [{ x: 2, y: 0 }],
      sockets: [{ face: 'west', socketType: 'doorway', reason: 'joins room' }],
      tags: ['stair'],
    });
  });

  test('selects a tile by placement index and returns null for empty inspection hits', () => {
    expect(selectTileByPlacementIndex(layout, catalog, 0)?.selectedTile?.tileName).toBe('Vault Room');
    expect(inspectTileAtGridCell(layout, catalog, { x: 9, y: 9 })).toBeNull();
    expect(selectTileByPlacementIndex(layout, catalog, 99)).toBeNull();
  });

  test('progressively renders visible tiles first and simplifies oversized tile details', () => {
    const largeTile: TileType = {
      ...roomTile,
      id: 'large-4x4',
      name: 'Large Chamber',
      dimensions: {
        unit: 'grid-cell',
        width: 4,
        height: 4,
        grid_cells: Array.from({ length: 16 }, (_, index) => ({ x: index % 4, y: Math.floor(index / 4) })),
      },
    };
    const progressiveLayout: Layout = {
      ...layout,
      placements: [
        { tile_type_id: 'large-4x4', face_id: 'front', x: 0, y: 0, rotation: 0, grid_cells: largeTile.dimensions.grid_cells },
        { tile_type_id: 'stair-1x1', face_id: 'top', x: 50, y: 50, rotation: 90, grid_cells: [{ x: 50, y: 50 }] },
      ],
    };

    const model = buildLayoutPreviewScreenModel(progressiveLayout, [largeTile, stairTile], {
      viewportWidth: 120,
      viewportHeight: 120,
      cellSize: 20,
      detailCellThreshold: 4,
    });

    expect(model.schematic.tiles.map((tile) => tile.tileTypeId)).toEqual(['large-4x4']);
    expect(model.schematic.deferredTileCount).toBe(1);
    expect(model.schematic.simplifiedTileCount).toBe(1);
    expect(model.schematic.tiles[0].simplified).toBe(true);
    expect(model.schematic.tiles[0].sockets).toEqual([]);
  });

});
