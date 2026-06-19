import { z } from 'zod';

export const edgeFaceSchema = z.string().min(1);

export const socketTypeSchema = z.enum([
  'wall',
  'open-floor',
  'doorway',
]);

export const rotationSchema = z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]);

export const catalogStatusSchema = z.enum(['official', 'custom', 'deprecated', 'draft']);

export const tileCategorySchema = z.enum([
  'floor',
  'wall',
  'doorway',
  'scatter',
  'custom',
]);

export const inventoryConditionSchema = z.enum(['new', 'good', 'worn', 'damaged', 'unknown']);

export const gridCellSchema = z
  .object({
    x: z.number().int(),
    y: z.number().int(),
  })
  .strict();

export const tileDimensionsSchema = z
  .object({
    unit: z.enum(['grid-cell', 'mm', 'inch']),
    width: z.number().positive(),
    height: z.number().positive(),
    grid_cells: z.array(gridCellSchema).min(1),
  })
  .strict();

export const edgeSocketSchema = z
  .object({
    face: edgeFaceSchema,
    socket_type: socketTypeSchema,
    bidirectional: z.boolean(),
    reason: z.string().min(1),
  })
  .strict();

export const rotationRulesSchema = z
  .object({
    allowed_rotations: z.array(rotationSchema).min(1),
    flip_allowed: z.boolean(),
  })
  .strict();

export const tileFaceSchema = z
  .object({
    face_id: z.string().min(1),
    face_name: z.string().min(1),
    role_tags: z.array(z.string().min(1)),
    edge_sockets: z.array(edgeSocketSchema).min(1),
    rotation_rules: rotationRulesSchema,
    theme_tags: z.array(z.string().min(1)),
  })
  .strict();

export const tileTypeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    product_set: z.string().min(1),
    dimensions: tileDimensionsSchema,
    faces: z.array(tileFaceSchema).min(1),
    catalog_status: catalogStatusSchema,
    category: tileCategorySchema,
    tags: z.array(z.string().min(1)),
    catalog_version: z.string().min(1),
    notes: z.string().optional(),
  })
  .strict()
  .superRefine((tile, ctx) => {
    const faceIds = new Set<string>();

    tile.faces.forEach((face, index) => {
      if (faceIds.has(face.face_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['faces', index, 'face_id'],
          message: `Duplicate face_id '${face.face_id}' on tile '${tile.id}'`,
        });
      }
      faceIds.add(face.face_id);
    });
  });

export const inventoryItemSchema = z
  .object({
    tile_type_id: z.string().min(1),
    owned_quantity: z.number().int().nonnegative(),
    condition: inventoryConditionSchema,
    notes: z.string().optional(),
    storage_location: z.string().optional(),
  })
  .strict();

export const layoutPlacementSchema = z
  .object({
    tile_type_id: z.string().min(1),
    face_id: z.string().min(1),
    x: z.number().int(),
    y: z.number().int(),
    rotation: rotationSchema,
    grid_cells: z.array(gridCellSchema).min(1),
  })
  .strict();

export const layoutSchema = z
  .object({
    id: z.string().min(1),
    placements: z.array(layoutPlacementSchema),
    seed: z.string().min(1),
    goal: z.string().min(1),
    solver_version: z.string().min(1),
    catalog_version: z.string().min(1),
    created_at: z.string().datetime({ offset: true }),
  })
  .strict();

export type GridCellInput = z.infer<typeof gridCellSchema>;
export type TileDimensionsInput = z.infer<typeof tileDimensionsSchema>;
export type EdgeSocketInput = z.infer<typeof edgeSocketSchema>;
export type RotationRulesInput = z.infer<typeof rotationRulesSchema>;
export type TileFaceInput = z.infer<typeof tileFaceSchema>;
export type TileTypeInput = z.infer<typeof tileTypeSchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type LayoutPlacementInput = z.infer<typeof layoutPlacementSchema>;
export type LayoutInput = z.infer<typeof layoutSchema>;
