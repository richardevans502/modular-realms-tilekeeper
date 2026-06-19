/** Cardinal or named side of a tile face edge. */
export type EdgeFace = 'north' | 'east' | 'south' | 'west' | string;

/** Explicit edge socket category used by catalog and layout compatibility checks. */
export type SocketType = 'wall' | 'open-floor' | 'doorway';

/** Allowed quarter-turn placement rotations in degrees. */
export type Rotation = 0 | 90 | 180 | 270;

/** Catalog lifecycle state for a tile type definition. */
export type CatalogStatus = 'official' | 'custom' | 'deprecated' | 'draft';

/** High-level functional category for tile browsing and solver heuristics. */
export type TileCategory = 'floor' | 'wall' | 'doorway' | 'scatter' | 'custom';

/** User-observed physical condition for owned tile inventory. */
export type InventoryCondition = 'new' | 'good' | 'worn' | 'damaged' | 'unknown';

/** A discrete grid cell occupied by a tile footprint or placement. */
export interface GridCell {
  /** Zero-based grid X coordinate. */
  x: number;
  /** Zero-based grid Y coordinate. */
  y: number;
}

/** Physical dimensions and occupied-cell footprint for a tile type. */
export interface TileDimensions {
  /** Measurement unit for width and height. */
  unit: 'grid-cell' | 'mm' | 'inch';
  /** Width of the tile footprint in the selected unit. */
  width: number;
  /** Height of the tile footprint in the selected unit. */
  height: number;
  /** Explicit occupied cells for non-trivial footprints; rectangular tiles may list all cells for clarity. */
  grid_cells: GridCell[];
}

/** Evidence-backed edge socket on one side of a tile face. */
export interface EdgeSocket {
  /** Side of the face where this socket appears. */
  face: EdgeFace;
  /** Socket category exposed by this edge. */
  socket_type: SocketType;
  /** Whether the compatibility rule applies in both directions. */
  bidirectional: boolean;
  /** Human-readable evidence or catalog rationale for this socket assignment. */
  reason: string;
}

/** Rotation constraints for a specific tile face. */
export interface RotationRules {
  /** Quarter-turn rotations allowed for this face when placed in a layout. */
  allowed_rotations: Rotation[];
  /** Whether the physical/visual face may be mirrored in future tooling. */
  flip_allowed: boolean;
}

/** One usable face of a physical tile; double-sided tiles contain multiple faces. */
export interface TileFace {
  /** Stable identifier unique within the parent tile type. */
  face_id: string;
  /** Human-readable face name shown in catalog and exports. */
  face_name: string;
  /** Functional role tags used by browsing and solver heuristics. */
  role_tags: string[];
  /** Edge sockets exposed by this face. */
  edge_sockets: EdgeSocket[];
  /** Rotation and flip constraints for this face. */
  rotation_rules: RotationRules;
  /** Visual or thematic tags for filtering and export labelling. */
  theme_tags: string[];
}

/** Catalog definition for one physical tile type, not one visual face. */
export interface TileType {
  /** Stable catalog or custom tile type identifier. */
  id: string;
  /** Human-readable tile type name. */
  name: string;
  /** Product set or pack this physical tile belongs to. */
  product_set: string;
  /** Physical footprint and occupied cells for the tile. */
  dimensions: TileDimensions;
  /** One or more usable faces on the physical tile. */
  faces: TileFace[];
  /** Catalog lifecycle status. */
  catalog_status: CatalogStatus;
  /** Functional tile category. */
  category: TileCategory;
  /** Additional catalog tags for filtering or solver hints. */
  tags: string[];
  /** Version of the catalog data that introduced or last updated this tile. */
  catalog_version: string;
  /** Optional author notes or source clarification. */
  notes?: string;
}

/** Physical inventory record for owned tiles; inventory is intentionally not face-level. */
export interface InventoryItem {
  /** Tile type identifier for the physical tile being counted. */
  tile_type_id: string;
  /** Number of physical copies owned. */
  owned_quantity: number;
  /** Condition of the owned tile copies. */
  condition: InventoryCondition;
  /** Optional user notes about this inventory line. */
  notes?: string;
  /** Optional place where the physical tiles are stored. */
  storage_location?: string;
}

/** A tile placement within a generated or saved layout. */
export interface LayoutPlacement {
  /** Physical tile type consumed by this placement. */
  tile_type_id: string;
  /** Face of the physical tile selected for this placement. */
  face_id: string;
  /** Anchor grid X coordinate. */
  x: number;
  /** Anchor grid Y coordinate. */
  y: number;
  /** Quarter-turn rotation applied to the selected face. */
  rotation: Rotation;
  /** Absolute grid cells occupied by this placement after rotation. */
  grid_cells: GridCell[];
}

/** Portable generated-layout record for JSON export, backup, and solver regression tests. */
export interface Layout {
  /** Stable layout identifier. */
  id: string;
  /** Tile placements in the generated layout. */
  placements: LayoutPlacement[];
  /** Deterministic seed used by the solver. */
  seed: string;
  /** Human-readable generation goal or brief. */
  goal: string;
  /** Solver implementation version used to produce this layout. */
  solver_version: string;
  /** Catalog version used to validate tile references. */
  catalog_version: string;
  /** ISO-8601 timestamp when the layout was created. */
  created_at: string;
}
