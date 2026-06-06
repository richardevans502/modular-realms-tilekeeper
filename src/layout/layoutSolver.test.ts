import type { InventoryItem, Rotation, SocketType, TileType } from '../shared/types';
import { validateSocketCompatibility } from './placementGrid';
import { solveLayoutFromInventory } from './layoutSolver';

function singleCellTile(
  id: string,
  faces: Array<{
    face_id: string;
    sockets: Record<'north' | 'east' | 'south' | 'west', SocketType>;
    allowed_rotations?: Rotation[];
  }>,
): TileType {
  return {
    id,
    name: id,
    product_set: 'Solver Test Pack',
    dimensions: {
      unit: 'grid-cell',
      width: 1,
      height: 1,
      grid_cells: [{ x: 0, y: 0 }],
    },
    faces: faces.map((face) => ({
      face_id: face.face_id,
      face_name: face.face_id,
      role_tags: ['room'],
      edge_sockets: (['north', 'east', 'south', 'west'] as const).map((edge) => ({
        face: edge,
        socket_type: face.sockets[edge],
        bidirectional: true,
        reason: `${edge} ${face.sockets[edge]}`,
      })),
      rotation_rules: { allowed_rotations: face.allowed_rotations ?? [0, 90, 180, 270], flip_allowed: false },
      theme_tags: ['test'],
    })),
    catalog_status: 'custom',
    category: 'floor',
    tags: ['test'],
    catalog_version: 'test-catalog',
  };
}

function inventory(tile_type_id: string, owned_quantity: number, reserved = 0): InventoryItem {
  return {
    tile_type_id,
    owned_quantity,
    reserved,
    condition: 'good',
  };
}

const doorwayRun = singleCellTile('doorway-run', [
  {
    face_id: 'front',
    sockets: { north: 'wall', east: 'doorway', south: 'wall', west: 'doorway' },
  },
]);

describe('layout solver inventory constraints and face selection', () => {
  test('generates deterministic layouts without consuming more physical tiles than available inventory', () => {
    const first = solveLayoutFromInventory({
      catalog: [doorwayRun],
      inventory: [inventory('doorway-run', 3, 1)],
      bounds: { width: 5, height: 1 },
      targetPlacements: 4,
      seed: 'inventory-limit-seed',
      goal: 'inventory limit test',
      createdAt: '2026-06-06T12:00:00.000Z',
    });
    const second = solveLayoutFromInventory({
      catalog: [doorwayRun],
      inventory: [inventory('doorway-run', 3, 1)],
      bounds: { width: 5, height: 1 },
      targetPlacements: 4,
      seed: 'inventory-limit-seed',
      goal: 'inventory limit test',
      createdAt: '2026-06-06T12:00:00.000Z',
    });

    expect(first).toEqual(second);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error('expected solver success');
    }

    expect(first.layout.placements).toHaveLength(2);
    expect(first.trace.inventoryConsumed).toEqual({ 'doorway-run': 2 });
    expect(first.trace.missingRequestedPlacements).toBe(2);
  });

  test('selects the compatible face and allowed rotation for double-sided physical tiles', () => {
    const doubleSidedConnector = singleCellTile('double-sided-connector', [
      {
        face_id: 'wall-face',
        sockets: { north: 'wall', east: 'wall', south: 'wall', west: 'wall' },
      },
      {
        face_id: 'door-face',
        sockets: { north: 'doorway', east: 'wall', south: 'wall', west: 'wall' },
        allowed_rotations: [270],
      },
    ]);

    const result = solveLayoutFromInventory({
      catalog: [doorwayRun, doubleSidedConnector],
      inventory: [inventory('doorway-run', 1), inventory('double-sided-connector', 1)],
      bounds: { width: 2, height: 1 },
      targetPlacements: 2,
      seed: 'face-selection-seed',
      goal: 'face selection test',
      createdAt: '2026-06-06T12:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('expected solver success');
    }

    expect(result.layout.placements).toEqual([
      {
        tile_type_id: 'doorway-run',
        face_id: 'front',
        x: 0,
        y: 0,
        rotation: 0,
        grid_cells: [{ x: 0, y: 0 }],
      },
      {
        tile_type_id: 'double-sided-connector',
        face_id: 'door-face',
        x: 1,
        y: 0,
        rotation: 270,
        grid_cells: [{ x: 1, y: 0 }],
      },
    ]);
    expect(validateSocketCompatibility({ bounds: { width: 2, height: 1 }, placements: result.layout.placements, occupiedCells: [] }, [doorwayRun, doubleSidedConnector])).toEqual({ ok: true });
    expect(result.trace.inventoryConsumed).toEqual({ 'doorway-run': 1, 'double-sided-connector': 1 });
  });
});
