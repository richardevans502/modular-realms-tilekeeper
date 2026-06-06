import type { LayoutPlacement, TileType } from '../shared/types';
import {
  buildSchematicPreviewModel,
  renderSchematicPreviewSvg,
  type SchematicPreviewOptions,
} from './schematicPreview';

const previewOptions: SchematicPreviewOptions = {
  cellSize: 24,
  padding: 8,
  showGrid: true,
};

const roomTile: TileType = {
  id: 'room-2x1',
  name: 'Room 2x1',
  product_set: 'Preview Test Pack',
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
      face_name: 'Front',
      role_tags: ['room'],
      edge_sockets: [
        { face: 'north', socket_type: 'wall', bidirectional: true, reason: 'solid wall' },
        { face: 'east', socket_type: 'doorway', bidirectional: true, reason: 'door' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'open' },
        { face: 'west', socket_type: 'wall', bidirectional: true, reason: 'solid wall' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: false },
      theme_tags: ['crypt'],
    },
  ],
  catalog_status: 'custom',
  category: 'floor',
  tags: ['test'],
  catalog_version: 'test',
};

const pillarTile: TileType = {
  ...roomTile,
  id: 'pillar-1x1',
  name: 'Pillar',
  dimensions: {
    unit: 'grid-cell',
    width: 1,
    height: 1,
    grid_cells: [{ x: 0, y: 0 }],
  },
};

const placements: LayoutPlacement[] = [
  {
    tile_type_id: 'room-2x1',
    face_id: 'front',
    x: 2,
    y: 1,
    rotation: 0,
    grid_cells: [
      { x: 2, y: 1 },
      { x: 3, y: 1 },
    ],
  },
  {
    tile_type_id: 'pillar-1x1',
    face_id: 'front',
    x: -1,
    y: 0,
    rotation: 90,
    grid_cells: [{ x: -1, y: 0 }],
  },
];

describe('schematic preview renderer', () => {
  test('builds a top-down render model normalized around occupied cells with grid and labels', () => {
    expect(buildSchematicPreviewModel(placements, [roomTile, pillarTile], previewOptions)).toEqual({
      width: 120,
      height: 72,
      origin: { x: -1, y: 0 },
      cellSize: 24,
      padding: 8,
      bounds: { minX: -1, minY: 0, maxX: 3, maxY: 1, width: 5, height: 2 },
      gridCells: [
        { key: '-1,0', grid: { x: -1, y: 0 }, x: 8, y: 8 },
        { key: '0,0', grid: { x: 0, y: 0 }, x: 32, y: 8 },
        { key: '1,0', grid: { x: 1, y: 0 }, x: 56, y: 8 },
        { key: '2,0', grid: { x: 2, y: 0 }, x: 80, y: 8 },
        { key: '3,0', grid: { x: 3, y: 0 }, x: 104, y: 8 },
        { key: '-1,1', grid: { x: -1, y: 1 }, x: 8, y: 32 },
        { key: '0,1', grid: { x: 0, y: 1 }, x: 32, y: 32 },
        { key: '1,1', grid: { x: 1, y: 1 }, x: 56, y: 32 },
        { key: '2,1', grid: { x: 2, y: 1 }, x: 80, y: 32 },
        { key: '3,1', grid: { x: 3, y: 1 }, x: 104, y: 32 },
      ],
      tiles: [
        {
          key: '0:room-2x1:front',
          placementIndex: 0,
          tileTypeId: 'room-2x1',
          faceId: 'front',
          label: 'Room 2x1',
          rotation: 0,
          color: '#7dd3fc',
          cells: [
            { key: '2,1', grid: { x: 2, y: 1 }, x: 80, y: 32 },
            { key: '3,1', grid: { x: 3, y: 1 }, x: 104, y: 32 },
          ],
          sockets: [
            { face: 'north', socketType: 'wall', x1: 80, y1: 32, x2: 128, y2: 32 },
            { face: 'east', socketType: 'doorway', x1: 128, y1: 32, x2: 128, y2: 56 },
            { face: 'south', socketType: 'open-floor', x1: 80, y1: 56, x2: 128, y2: 56 },
            { face: 'west', socketType: 'wall', x1: 80, y1: 32, x2: 80, y2: 56 },
          ],
          labelAnchor: { x: 104, y: 44 },
        },
        {
          key: '1:pillar-1x1:front',
          placementIndex: 1,
          tileTypeId: 'pillar-1x1',
          faceId: 'front',
          label: 'Pillar',
          rotation: 90,
          color: '#c4b5fd',
          cells: [{ key: '-1,0', grid: { x: -1, y: 0 }, x: 8, y: 8 }],
          sockets: [
            { face: 'east', socketType: 'wall', x1: 32, y1: 8, x2: 32, y2: 32 },
            { face: 'south', socketType: 'doorway', x1: 8, y1: 32, x2: 32, y2: 32 },
            { face: 'west', socketType: 'open-floor', x1: 8, y1: 8, x2: 8, y2: 32 },
            { face: 'north', socketType: 'wall', x1: 8, y1: 8, x2: 32, y2: 8 },
          ],
          labelAnchor: { x: 20, y: 20 },
        },
      ],
    });
  });

  test('renders deterministic standalone svg with data attributes and socket styling', () => {
    const svg = renderSchematicPreviewSvg(placements, [roomTile, pillarTile], previewOptions);

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="72" viewBox="0 0 120 72" role="img" aria-label="TileKeeper schematic preview: 2 placements">');
    expect(svg).toContain('<rect class="tile-cell" data-placement-index="0" data-tile-type-id="room-2x1" data-face-id="front" x="80" y="32" width="24" height="24" rx="3" fill="#7dd3fc"/>');
    expect(svg).toContain('<line class="socket socket-doorway" data-placement-index="0" data-face="east" x1="128" y1="32" x2="128" y2="56" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>');
    expect(svg).toContain('<text class="tile-label" x="104" y="44" text-anchor="middle" dominant-baseline="central">Room 2x1</text>');
    expect(svg).toContain('<path class="rotation-marker" data-placement-index="1" d="M 20 13 L 24 20 L 20 27" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
  });

  test('escapes svg labels and fails loudly for unknown tile references', () => {
    const unsafeCatalog: TileType[] = [{ ...pillarTile, name: 'Pillar <script>alert(1)</script>' }];
    const unsafePlacement: LayoutPlacement = { ...placements[1], tile_type_id: 'pillar-1x1' };

    expect(renderSchematicPreviewSvg([unsafePlacement], unsafeCatalog, previewOptions)).toContain(
      'Pillar &lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(() => buildSchematicPreviewModel([{ ...unsafePlacement, tile_type_id: 'missing' }], unsafeCatalog)).toThrow(
      "Tile 'missing' not found in catalog",
    );
  });
});
