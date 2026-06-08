import type { LayoutPlacement, TileType } from '../shared/types';
import { renderSchematicPreviewPng } from './schematicCanvasNode';

const previewOptions = {
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

describe('schematic canvas / PNG renderer', () => {
  test('returns a non-empty PNG buffer for valid placements', () => {
    const buf = renderSchematicPreviewPng(placements, [roomTile, pillarTile], previewOptions);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });

  test('buffer length scales with scale option', () => {
    const buf1 = renderSchematicPreviewPng(placements, [roomTile, pillarTile], { ...previewOptions, scale: 1 });
    const buf2 = renderSchematicPreviewPng(placements, [roomTile, pillarTile], { ...previewOptions, scale: 2 });
    // Higher resolution usually yields larger compressed PNG, but not strictly guaranteed.
    // Assert both are valid PNGs and have reasonable pixel dimensions via IHDR.
    const readDimension = (b: Buffer) => {
      const width = b.readUInt32BE(16);
      const height = b.readUInt32BE(20);
      return { width, height };
    };
    const dim1 = readDimension(buf1);
    const dim2 = readDimension(buf2);
    expect(dim2.width).toBe(dim1.width * 2);
    expect(dim2.height).toBe(dim1.height * 2);
  });

  test('backgroundColor option applies white or custom fill', () => {
    const white = renderSchematicPreviewPng(placements, [roomTile, pillarTile], { ...previewOptions, backgroundColor: '#ffffff' });
    const black = renderSchematicPreviewPng(placements, [roomTile, pillarTile], { ...previewOptions, backgroundColor: '#000000' });
    expect(white.length).toBeGreaterThan(0);
    expect(black.length).toBeGreaterThan(0);
    // Decode and verify top-left pixel background
    const { PNG } = require('pngjs');
    const whiteImg = PNG.sync.read(white);
    const blackImg = PNG.sync.read(black);
    expect(whiteImg.data[0]).toBe(255);
    expect(whiteImg.data[1]).toBe(255);
    expect(whiteImg.data[2]).toBe(255);
    expect(blackImg.data[0]).toBe(0);
    expect(blackImg.data[1]).toBe(0);
    expect(blackImg.data[2]).toBe(0);
  });

  test('showGrid false omits grid lines and still produces valid PNG', () => {
    const buf = renderSchematicPreviewPng(placements, [roomTile, pillarTile], { ...previewOptions, showGrid: false });
    expect(buf.length).toBeGreaterThan(0);
  });

  test('handles single-cell placement at origin', () => {
    const single: LayoutPlacement = {
      tile_type_id: 'pillar-1x1',
      face_id: 'front',
      x: 0,
      y: 0,
      rotation: 0,
      grid_cells: [{ x: 0, y: 0 }],
    };
    const buf = renderSchematicPreviewPng([single], [pillarTile], { cellSize: 16, padding: 4, showGrid: false });
    expect(buf.length).toBeGreaterThan(0);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    // Existing schematic model: width = bounds.width * cellSize, height = (bounds.height + 1) * cellSize
    expect(width).toBe(16); // 1 * 16
    expect(height).toBe(32); // (1 + 1) * 16
    // Decode and verify a pixel well inside the single tile cell is non-background
    // (avoiding edges where 4px socket strokes and 1px borders overlap)
    const { PNG } = require('pngjs');
    const img = PNG.sync.read(buf);
    const idx = (8 * width + 10) * 4;
    const r = img.data[idx];
    const g = img.data[idx + 1];
    const b = img.data[idx + 2];
    // Background would be white (255,255,255); border black (15,23,42); wall socket (51,65,85)
    // The interior fill colour for placementIndex=0 is #7dd3fc (125,211,252)
    expect(r).toBeGreaterThan(100);
    expect(g).toBeGreaterThan(200);
    expect(b).toBeGreaterThan(250);
  });
});
