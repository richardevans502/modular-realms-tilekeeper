import { z } from 'zod';

import seedCatalogJson from './seed-catalog.json';
import { catalogStatusSchema, tileCategorySchema, tileDimensionsSchema, tileFaceSchema, tileTypeSchema } from '../shared/schemas';
import type { TileType } from '../shared/types';

const seedCatalogEntrySchema = z
  .object({
    tile_type_id: z.string().min(1),
    official_name: z.string().min(1),
    product_set_name: z.string().min(1),
    dimensions: tileDimensionsSchema,
    faces: z.array(tileFaceSchema).min(1),
    theme_tags: z.array(z.string().min(1)).min(1),
    category: tileCategorySchema,
    catalog_status: catalogStatusSchema,
    catalog_version: z.string().min(1),
    notes: z.string().optional(),
  })
  .strict();

const seedCatalogSchema = z.array(seedCatalogEntrySchema).min(20).max(50).superRefine((entries, ctx) => {
  const ids = new Set<string>();
  entries.forEach((entry, index) => {
    if (ids.has(entry.tile_type_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'tile_type_id'],
        message: `Duplicate tile_type_id '${entry.tile_type_id}'`,
      });
    }
    ids.add(entry.tile_type_id);
  });
});

export type SeedCatalogEntry = z.infer<typeof seedCatalogEntrySchema>;

function toTileType(entry: SeedCatalogEntry): TileType {
  return tileTypeSchema.parse({
    id: entry.tile_type_id,
    name: entry.official_name,
    product_set: entry.product_set_name,
    dimensions: entry.dimensions,
    faces: entry.faces,
    catalog_status: entry.catalog_status,
    category: entry.category,
    tags: entry.theme_tags,
    catalog_version: entry.catalog_version,
    notes: entry.notes,
  }) as TileType;
}

export function loadSeedCatalog(rawCatalog: unknown = seedCatalogJson): TileType[] {
  return seedCatalogSchema.parse(rawCatalog).map(toTileType);
}

export function loadRawSeedCatalog(rawCatalog: unknown = seedCatalogJson): SeedCatalogEntry[] {
  return seedCatalogSchema.parse(rawCatalog);
}
