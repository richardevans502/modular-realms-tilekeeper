import type { LayoutPlacement, TileType } from '../shared/types';
import { buildSchematicPreviewModel, type SchematicPreviewOptions } from './schematicPreview';

export interface SchematicCanvasRenderOptions extends SchematicPreviewOptions {
  /** Output scale factor (integer ≥ 1). Defaults to 1. */
  scale?: number;
  /** Background colour hex. Defaults to #ffffff. */
  backgroundColor?: string;
}

interface RGBA { r: number; g: number; b: number; a: number }

export function hexToRgba(hex: string): RGBA {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
    a: 255,
  };
}

function blend(c: RGBA, bg: RGBA): RGBA {
  const a = c.a / 255;
  const ia = 1 - a;
  return {
    r: Math.round(c.r * a + bg.r * ia),
    g: Math.round(c.g * a + bg.g * ia),
    b: Math.round(c.b * a + bg.b * ia),
    a: 255,
  };
}

/** Minimal software canvas backed by an Uint8ClampedArray with 2D drawing primitives. */
export class SoftCanvas {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  private setPixel(x: number, y: number, c: RGBA): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    const blended = blend(c, { r: this.data[i], g: this.data[i + 1], b: this.data[i + 2], a: this.data[i + 3] });
    this.data[i] = blended.r;
    this.data[i + 1] = blended.g;
    this.data[i + 2] = blended.b;
    this.data[i + 3] = blended.a;
  }

  fillRect(x: number, y: number, w: number, h: number, color: string): void {
    const c = hexToRgba(color);
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.width, Math.ceil(x + w));
    const y1 = Math.min(this.height, Math.ceil(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.setPixel(px, py, c);
      }
    }
  }

  strokeRect(x: number, y: number, w: number, h: number, color: string, lineWidth: number): void {
    const c = hexToRgba(color);
    const lw = Math.max(1, Math.round(lineWidth));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.ceil(x + w);
    const y1 = Math.ceil(y + h);
    for (let t = 0; t < lw; t++) {
      for (let px = x0 - t; px <= x1 + t; px++) {
        this.setPixel(px, y0 - t, c);
        this.setPixel(px, y1 + t, c);
      }
      for (let py = y0 - t; py <= y1 + t; py++) {
        this.setPixel(x0 - t, py, c);
        this.setPixel(x1 + t, py, c);
      }
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth: number): void {
    const c = hexToRgba(color);
    const lw = Math.max(1, Math.round(lineWidth));
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2 + 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = Math.round(x1 + dx * t);
      const py = Math.round(y1 + dy * t);
      for (let ox = -Math.floor(lw / 2); ox <= Math.floor(lw / 2); ox++) {
        for (let oy = -Math.floor(lw / 2); oy <= Math.floor(lw / 2); oy++) {
          this.setPixel(px + ox, py + oy, c);
        }
      }
    }
  }

  fillTriangle(points: Array<{ x: number; y: number }>, color: string): void {
    const c = hexToRgba(color);
    const minX = Math.max(0, Math.floor(Math.min(...points.map((p) => p.x))));
    const minY = Math.max(0, Math.floor(Math.min(...points.map((p) => p.y))));
    const maxX = Math.min(this.width, Math.ceil(Math.max(...points.map((p) => p.x))));
    const maxY = Math.min(this.height, Math.ceil(Math.max(...points.map((p) => p.y))));
    const [a, b, cc] = points;
    const area = (b.x - a.x) * (cc.y - a.y) - (cc.x - a.x) * (b.y - a.y);
    if (area === 0) return;
    const sign = area > 0 ? 1 : -1;
    for (let py = minY; py < maxY; py++) {
      for (let px = minX; px < maxX; px++) {
        const w1 = sign * ((b.x - a.x) * (py - a.y) - (px - a.x) * (b.y - a.y));
        const w2 = sign * ((cc.x - b.x) * (py - b.y) - (px - b.x) * (cc.y - b.y));
        const w3 = sign * ((a.x - cc.x) * (py - cc.y) - (px - cc.x) * (a.y - cc.y));
        if (w1 >= 0 && w2 >= 0 && w3 >= 0) {
          this.setPixel(px, py, c);
        }
      }
    }
  }
}

/**
 * Renders a schematic preview to a PNG Buffer using a software canvas.
 * This works in any Node / Jest environment without native canvas libraries.
 *
 * NOTE: The Node implementation using `require('pngjs')` lives in
 * `schematicCanvasNode.ts` so that Metro never attempts to bundle pngjs.
 * This file only exports the browser-safe renderer.
 */

/** Browser-only: renders a schematic preview to a PNG data URL using HTML Canvas. */
export function renderSchematicPreviewPngDataUrl(
  placements: LayoutPlacement[],
  catalog: TileType[],
  options: SchematicCanvasRenderOptions = {},
): string {
  if (typeof document === 'undefined') {
    throw new Error('renderSchematicPreviewPngDataUrl requires a browser environment with document');
  }
  const scale = Math.max(1, Math.round(options.scale ?? 1));
  const baseOpts: SchematicPreviewOptions = {
    cellSize: (options.cellSize ?? 32) * scale,
    padding: (options.padding ?? 12) * scale,
    showGrid: options.showGrid,
  };
  const model = buildSchematicPreviewModel(placements, catalog, baseOpts);
  const htmlCanvas = document.createElement('canvas');
  htmlCanvas.width = model.width;
  htmlCanvas.height = model.height;
  const ctx = htmlCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to get 2D canvas context');
  }

  ctx.fillStyle = options.backgroundColor ?? '#ffffff';
  ctx.fillRect(0, 0, model.width, model.height);

  if (options.showGrid ?? false) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1 * scale;
    for (const cell of model.gridCells) {
      ctx.strokeRect(cell.x, cell.y, model.cellSize, model.cellSize);
    }
  }

  for (const tile of model.tiles) {
    for (const cell of tile.cells) {
      ctx.fillStyle = tile.color;
      ctx.fillRect(cell.x, cell.y, model.cellSize, model.cellSize);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(cell.x, cell.y, model.cellSize, model.cellSize);
    }
    for (const socket of tile.sockets) {
      ctx.strokeStyle =
        socket.socketType === 'wall'
          ? '#334155'
          : socket.socketType === 'doorway'
            ? '#f59e0b'
            : '#22c55e';
      ctx.lineWidth = 4 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(socket.x1, socket.y1);
      ctx.lineTo(socket.x2, socket.y2);
      ctx.stroke();
    }
    const marker = rotationMarkerPoints(tile.labelAnchor, tile.rotation, scale);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(marker[0].x, marker[0].y);
    ctx.lineTo(marker[1].x, marker[1].y);
    ctx.lineTo(marker[2].x, marker[2].y);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = `600 ${10 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tile.label, tile.labelAnchor.x, tile.labelAnchor.y);
  }

  return htmlCanvas.toDataURL('image/png');
}


/** Platform-neutral: renders a schematic preview to a PNG data URL without DOM/canvas APIs. */
export function renderSchematicPreviewPngDataUrlPortable(
  placements: LayoutPlacement[],
  catalog: TileType[],
  options: SchematicCanvasRenderOptions = {},
): string {
  const bytes = renderSchematicPreviewPngBytes(placements, catalog, options);
  return `data:image/png;base64,${bytesToBase64(bytes)}`;
}

/** Platform-neutral: renders a schematic preview to encoded PNG bytes without native dependencies. */
export function renderSchematicPreviewPngBytes(
  placements: LayoutPlacement[],
  catalog: TileType[],
  options: SchematicCanvasRenderOptions = {},
): Uint8Array {
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

  return encodePngRgba(canvas.width, canvas.height, canvas.data);
}

function encodePngRgba(width: number, height: number, rgba: Uint8ClampedArray): Uint8Array {
  const scanlineLength = width * 4 + 1;
  const raw = new Uint8Array(scanlineLength * height);
  for (let y = 0; y < height; y++) {
    raw[y * scanlineLength] = 0; // PNG filter type: none
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * scanlineLength + 1);
  }

  const chunks = [
    pngChunk('IHDR', concatBytes(uint32be(width), uint32be(height), new Uint8Array([8, 6, 0, 0, 0]))),
    pngChunk('IDAT', zlibStore(raw)),
    pngChunk('IEND', new Uint8Array()),
  ];
  return concatBytes(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks);
}

function zlibStore(data: Uint8Array): Uint8Array {
  const blocks: Uint8Array[] = [new Uint8Array([0x78, 0x01])];
  for (let offset = 0; offset < data.length; offset += 0xffff) {
    const chunk = data.subarray(offset, Math.min(offset + 0xffff, data.length));
    const final = offset + chunk.length >= data.length ? 1 : 0;
    const header = new Uint8Array(5);
    header[0] = final;
    header[1] = chunk.length & 0xff;
    header[2] = (chunk.length >> 8) & 0xff;
    const nlen = (~chunk.length) & 0xffff;
    header[3] = nlen & 0xff;
    header[4] = (nlen >> 8) & 0xff;
    blocks.push(header, chunk);
  }
  blocks.push(uint32be(adler32(data)));
  return concatBytes(...blocks);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = asciiBytes(type);
  const crcInput = concatBytes(typeBytes, data);
  return concatBytes(uint32be(data.length), typeBytes, data, uint32be(crc32(crcInput)));
}

function asciiBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i);
  return bytes;
}

function uint32be(value: number): Uint8Array {
  return new Uint8Array([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    output += alphabet[a >> 2];
    output += alphabet[((a & 3) << 4) | (b >> 4)];
    output += i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=';
    output += i + 2 < bytes.length ? alphabet[c & 63] : '=';
  }
  return output;
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
