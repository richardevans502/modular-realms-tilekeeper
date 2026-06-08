import type { LayoutPlacement, TileType } from '../shared/types';
import { buildSchematicPreviewModel, type SchematicPreviewOptions } from './schematicPreview';
import { SoftCanvas, hexToRgba } from './schematicCanvas';

export interface SchematicCanvasRenderOptions extends SchematicPreviewOptions {
  /** Output scale factor (integer ≥ 1). Defaults to 1. */
  scale?: number;
  /** Background colour hex. Defaults to #ffffff. */
  backgroundColor?: string;
}

/**
 * Renders a schematic preview to a PNG Buffer using a software canvas.
 * This works in any Node / Jest environment without native canvas libraries.
 *
 * NOTE: This file is *not* bundled by Metro for the app build.
 * It lives in a separate file so that require('pngjs') never leaks into the app bundle.
 */
export function renderSchematicPreviewPng(
  placements: LayoutPlacement[],
  catalog: TileType[],
  options: SchematicCanvasRenderOptions = {},
): Buffer {
  const scale = Math.max(1, Math.round(options.scale ?? 1));
  const baseOpts: SchematicPreviewOptions = {
    cellSize: (options.cellSize ?? 32) * scale,
    padding: (options.padding ?? 12) * scale,
    showGrid: options.showGrid,
  };
  const model = buildSchematicPreviewModel(placements, catalog, baseOpts);
  const canvas = new SoftCanvas(model.width, model.height);
  const bg = hexToRgba(options.backgroundColor ?? '#ffffff');
  for (let i = 0; i < canvas.data.length; i += 4) {
    canvas.data[i] = bg.r;
    canvas.data[i + 1] = bg.g;
    canvas.data[i + 2] = bg.b;
    canvas.data[i + 3] = bg.a;
  }

  if (options.showGrid ?? false) {
    for (const cell of model.gridCells) {
      canvas.strokeRect(cell.x, cell.y, model.cellSize, model.cellSize, '#cbd5e1', 1 * scale);
    }
  }

  for (const tile of model.tiles) {
    for (const cell of tile.cells) {
      canvas.fillRect(cell.x, cell.y, model.cellSize, model.cellSize, tile.color);
      canvas.strokeRect(cell.x, cell.y, model.cellSize, model.cellSize, '#0f172a', 1 * scale);
    }
    for (const socket of tile.sockets) {
      const strokeColor =
        socket.socketType === 'wall'
          ? '#334155'
          : socket.socketType === 'doorway'
            ? '#f59e0b'
            : '#22c55e';
      canvas.line(socket.x1, socket.y1, socket.x2, socket.y2, strokeColor, 4 * scale);
    }
    const marker = rotationMarkerPoints(tile.labelAnchor, tile.rotation, scale);
    canvas.line(marker[0].x, marker[0].y, marker[1].x, marker[1].y, '#0f172a', 2 * scale);
    canvas.line(marker[1].x, marker[1].y, marker[2].x, marker[2].y, '#0f172a', 2 * scale);
  }

  const { PNG } = require('pngjs');
  const png = new PNG({ width: canvas.width, height: canvas.height });
  png.data = Buffer.from(canvas.data);
  return PNG.sync.write(png);
}

function rotationMarkerPoints(
  anchor: { x: number; y: number },
  rotation: 0 | 90 | 180 | 270,
  scale: number,
): Array<{ x: number; y: number }> {
  const offset = 7 * scale;
  const half = 4 * scale;
  switch (rotation) {
    case 0:
      return [
        { x: anchor.x - half, y: anchor.y + offset },
        { x: anchor.x, y: anchor.y },
        { x: anchor.x + half, y: anchor.y + offset },
      ];
    case 90:
      return [
        { x: anchor.x + offset, y: anchor.y - half },
        { x: anchor.x, y: anchor.y },
        { x: anchor.x + offset, y: anchor.y + half },
      ];
    case 180:
      return [
        { x: anchor.x - half, y: anchor.y - offset },
        { x: anchor.x, y: anchor.y },
        { x: anchor.x + half, y: anchor.y - offset },
      ];
    case 270:
      return [
        { x: anchor.x - offset, y: anchor.y - half },
        { x: anchor.x, y: anchor.y },
        { x: anchor.x - offset, y: anchor.y + half },
      ];
  }
}
