import { z } from 'zod';

import { canonicalJson, sha256Hex, type CatalogPack, type CatalogManifest, type SignedCatalogEnvelope } from './catalogRefresh';
import { tileTypeSchema } from '../shared/schemas';
import type { TileCategory, TileDimensions, TileFace, TileType } from '../shared/types';

const legacySeedTileSchema = z
  .object({
    tile_type_id: z.string().min(1),
    official_name: z.string().min(1),
    product_set_name: z.string().min(1),
    dimensions: z.custom<TileDimensions>(),
    faces: z.array(z.custom<TileFace>()).min(1),
    theme_tags: z.array(z.string().min(1)),
    category: z.custom<TileCategory>(),
    catalog_status: z.enum(['official', 'custom', 'deprecated', 'draft']),
    catalog_version: z.string().min(1),
    notes: z.string().optional(),
  })
  .strict();

export type LegacySeedTile = z.infer<typeof legacySeedTileSchema>;

export interface CatalogSourceReference {
  label: string;
  url: string;
  accessed_at: string;
  license?: string;
}

export interface CatalogAssetReference {
  id: string;
  type: 'image' | 'pdf' | 'source-page' | 'other';
  url: string;
  sha256: string;
  alt?: string;
}

export interface CatalogPackMigrationRecord {
  id: string;
  from_schema_version: number;
  to_schema_version: 1;
  applied_at: string;
  notes: string;
}

export interface CatalogPackBuildInput {
  id: string;
  version: string;
  tiles?: TileType[];
  legacyTiles?: unknown[];
  sources?: CatalogSourceReference[];
  assets?: CatalogAssetReference[];
  migrations?: CatalogPackMigrationRecord[];
  minimumAppVersion?: string;
}

export interface CatalogPublicationInput {
  catalogVersion: string;
  generatedAt: string;
  baseUrl: string;
  packs: CatalogPackBuildInput[];
  /** Test/static signature override; prefer hmacSecret for published packs. */
  signature?: string;
  /** Optional shared secret for HMAC-SHA256 signatures compatible with refreshCatalogFromManifest. */
  hmacSecret?: string;
}

export interface CatalogPublication {
  manifestPath: 'manifest.json';
  manifestEnvelope: SignedCatalogEnvelope<CatalogManifest>;
  packEnvelopes: Array<SignedCatalogEnvelope<CatalogPack>>;
  files: Record<string, SignedCatalogEnvelope<CatalogManifest> | SignedCatalogEnvelope<CatalogPack>>;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function migrateLegacySeedTile(rawTile: unknown): TileType {
  const legacyTile = legacySeedTileSchema.parse(rawTile);
  return tileTypeSchema.parse({
    id: legacyTile.tile_type_id,
    name: legacyTile.official_name,
    product_set: legacyTile.product_set_name,
    dimensions: legacyTile.dimensions,
    faces: legacyTile.faces,
    catalog_status: legacyTile.catalog_status,
    category: legacyTile.category,
    tags: legacyTile.theme_tags,
    catalog_version: legacyTile.catalog_version,
    ...(legacyTile.notes ? { notes: legacyTile.notes } : {}),
  }) as TileType;
}

function buildPackPayload(input: CatalogPackBuildInput, generatedAt: string): CatalogPack {
  const directTiles = input.tiles ?? [];
  const legacyTiles = input.legacyTiles?.map(migrateLegacySeedTile) ?? [];
  const migrations = [...(input.migrations ?? [])];

  if (legacyTiles.length > 0) {
    migrations.push({
      id: 'legacy-seed-v0-to-pack-v1',
      from_schema_version: 0,
      to_schema_version: 1,
      applied_at: generatedAt,
      notes: 'Mapped legacy seed fields tile_type_id/official_name/product_set_name/theme_tags into TileType id/name/product_set/tags.',
    });
  }

  return {
    schema_version: 1,
    id: input.id,
    version: input.version,
    ...(input.minimumAppVersion ? { minimum_app_version: input.minimumAppVersion } : {}),
    tiles: [...directTiles, ...legacyTiles].map((tile) => tileTypeSchema.parse(tile) as TileType),
    ...(input.sources ? { sources: input.sources } : {}),
    ...(input.assets ? { assets: input.assets } : {}),
    ...(migrations.length > 0 ? { migrations } : {}),
  };
}

async function hmacSignature(payload: unknown, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonicalJson(payload)));
  return Buffer.from(signature).toString('base64');
}

async function signEnvelope<Payload>(payload: Payload, signature?: string, hmacSecret?: string): Promise<SignedCatalogEnvelope<Payload>> {
  const resolvedSignature = hmacSecret ? await hmacSignature(payload, hmacSecret) : signature;
  return {
    payload,
    sha256: await sha256Hex(canonicalJson(payload)),
    ...(resolvedSignature ? { signature: resolvedSignature } : {}),
  };
}

export async function buildCatalogPublication(input: CatalogPublicationInput): Promise<CatalogPublication> {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const packPayloads = input.packs.map((pack) => buildPackPayload(pack, input.generatedAt));
  const packEnvelopes = await Promise.all(packPayloads.map((payload) => signEnvelope(payload, input.signature, input.hmacSecret)));

  const manifestPayload: CatalogManifest = {
    schema_version: 1,
    catalog_version: input.catalogVersion,
    generated_at: input.generatedAt,
    packs: packEnvelopes.map((envelope) => ({
      id: envelope.payload.id,
      version: envelope.payload.version,
      url: `${baseUrl}packs/${envelope.payload.id}.json`,
      sha256: envelope.sha256,
      ...(envelope.signature ? { signature: envelope.signature } : {}),
    })),
  };
  const manifestEnvelope = await signEnvelope(manifestPayload, input.signature, input.hmacSecret);
  const files: CatalogPublication['files'] = { 'manifest.json': manifestEnvelope };

  for (const packEnvelope of packEnvelopes) {
    files[`packs/${packEnvelope.payload.id}.json`] = packEnvelope;
  }

  return { manifestPath: 'manifest.json', manifestEnvelope, packEnvelopes, files };
}
