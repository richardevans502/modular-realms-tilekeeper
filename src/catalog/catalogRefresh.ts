import { z } from 'zod';

import { tileTypeSchema } from '../shared/schemas';
import type { TileType } from '../shared/types';
import type { TileKeeperDatabase } from '../db/runMigrations';

const catalogSourceReferenceSchema = z
  .object({
    label: z.string().min(1),
    url: z.string().url(),
    accessed_at: z.string().min(1),
    license: z.string().min(1).optional(),
  })
  .strict();

const catalogAssetReferenceSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['image', 'pdf', 'source-page', 'other']),
    url: z.string().url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/i),
    alt: z.string().min(1).optional(),
  })
  .strict();

const catalogPackMigrationSchema = z
  .object({
    id: z.string().min(1),
    from_schema_version: z.number().int().nonnegative(),
    to_schema_version: z.literal(1),
    applied_at: z.string().datetime({ offset: true }),
    notes: z.string().min(1),
  })
  .strict();

export const catalogPackSchema = z
  .object({
    schema_version: z.literal(1).optional(),
    id: z.string().min(1),
    version: z.string().min(1),
    minimum_app_version: z.string().min(1).optional(),
    tiles: z.array(tileTypeSchema).min(1),
    sources: z.array(catalogSourceReferenceSchema).optional(),
    assets: z.array(catalogAssetReferenceSchema).optional(),
    migrations: z.array(catalogPackMigrationSchema).optional(),
  })
  .strict();

export const catalogPackReferenceSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    url: z.string().url(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/i),
    signature: z.string().min(1).optional(),
  })
  .strict();

export const catalogManifestSchema = z
  .object({
    schema_version: z.literal(1),
    catalog_version: z.string().min(1),
    generated_at: z.string().datetime({ offset: true }),
    packs: z.array(catalogPackReferenceSchema),
  })
  .strict();

export const signedCatalogEnvelopeSchema = <Payload extends z.ZodTypeAny>(payloadSchema: Payload) =>
  z
    .object({
      payload: payloadSchema,
      sha256: z.string().regex(/^[a-f0-9]{64}$/i),
      signature: z.string().min(1).optional(),
    })
    .strict();

export type CatalogPack = z.infer<typeof catalogPackSchema>;
export type CatalogManifest = z.infer<typeof catalogManifestSchema>;
export type SignedCatalogEnvelope<Payload> = {
  payload: Payload;
  sha256: string;
  signature?: string;
};

export interface SignatureVerificationRequest {
  payload: string;
  signature: string;
  context: 'manifest' | 'pack';
}

export type SignatureVerifier = (request: SignatureVerificationRequest) => Promise<boolean>;

export interface HmacSignatureConfig {
  algorithm: 'hmac-sha256';
  /** Shared secret text used by Cloudflare Worker/R2 publishing tooling. */
  secret: string;
}

export interface Ed25519SignatureConfig {
  algorithm: 'ed25519';
  /** Raw Ed25519 public key encoded as base64. */
  publicKeyBase64: string;
}

export interface RefreshCatalogOptions {
  manifestUrl: string;
  db: TileKeeperDatabase;
  fetcher?: (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;
  signatureVerifier?: SignatureVerifier;
  signature?: HmacSignatureConfig | Ed25519SignatureConfig;
}

export interface CatalogRefreshResult {
  refreshedPackIds: string[];
  tilesUpserted: number;
  catalogVersion: string;
}

type CatalogRefreshFailureKind = 'network' | 'invalid-data' | 'integrity' | 'storage' | 'schema-version';

const USER_MESSAGES: Record<CatalogRefreshFailureKind, string> = {
  network: 'Could not refresh the catalog. Your existing offline catalog is still available.',
  'invalid-data': 'The catalog update was not in a format TileKeeper understands. Your existing offline catalog is unchanged.',
  integrity: 'The downloaded catalog could not be verified. Your existing offline catalog is unchanged.',
  storage: 'The catalog update could not be saved. Your existing offline catalog is still available.',
  'schema-version': 'This catalog requires a newer TileKeeper app version. Your existing offline catalog is unchanged.',
};

export class CatalogRefreshError extends Error {
  readonly userMessage: string;
  readonly kind: CatalogRefreshFailureKind;
  readonly cause?: unknown;

  constructor(kind: CatalogRefreshFailureKind, cause?: unknown, userMessage = USER_MESSAGES[kind]) {
    super(userMessage);
    this.name = 'CatalogRefreshError';
    this.userMessage = userMessage;
    this.kind = kind;
    this.cause = cause;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sortForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForCanonicalJson);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((sorted, key) => {
      const item = value[key];
      if (item !== undefined) {
        sorted[key] = sortForCanonicalJson(item);
      }
      return sorted;
    }, {});
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortForCanonicalJson(value));
}

function getWebCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new CatalogRefreshError('integrity', new Error('WebCrypto is not available'));
  }
  return globalThis.crypto;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function bytesAsArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof atob === 'function') {
    return bytesAsArrayBuffer(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
  }

  const bufferConstructor = (globalThis as unknown as { Buffer?: { from(input: string, encoding: 'base64'): Uint8Array } }).Buffer;
  if (!bufferConstructor) {
    throw new CatalogRefreshError('integrity', new Error('Base64 decoding is not available'));
  }
  return bytesAsArrayBuffer(bufferConstructor.from(base64, 'base64'));
}

export async function sha256Hex(content: string): Promise<string> {
  const digest = await getWebCrypto().subtle.digest('SHA-256', new TextEncoder().encode(content));
  return bytesToHex(digest);
}

async function createConfiguredSignatureVerifier(config: HmacSignatureConfig | Ed25519SignatureConfig): Promise<SignatureVerifier> {
  const crypto = getWebCrypto();

  if (config.algorithm === 'hmac-sha256') {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(config.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    return async ({ payload, signature }) =>
      crypto.subtle.verify('HMAC', key, base64ToArrayBuffer(signature), new TextEncoder().encode(payload));
  }

  const key = await crypto.subtle.importKey('raw', base64ToArrayBuffer(config.publicKeyBase64), { name: 'Ed25519' }, false, ['verify']);
  return async ({ payload, signature }) =>
    crypto.subtle.verify({ name: 'Ed25519' }, key, base64ToArrayBuffer(signature), new TextEncoder().encode(payload));
}

async function assertEnvelopeIntegrity<Payload>(
  envelope: SignedCatalogEnvelope<Payload>,
  context: 'manifest' | 'pack',
  signatureVerifier?: SignatureVerifier,
): Promise<string> {
  const canonicalPayload = canonicalJson(envelope.payload);
  const actualSha256 = await sha256Hex(canonicalPayload);

  if (actualSha256.toLowerCase() !== envelope.sha256.toLowerCase()) {
    throw new CatalogRefreshError('integrity', new Error(`${context} checksum mismatch`));
  }

  if (envelope.signature && signatureVerifier) {
    const verified = await signatureVerifier({ payload: canonicalPayload, signature: envelope.signature, context });
    if (!verified) {
      throw new CatalogRefreshError('integrity', new Error(`${context} signature mismatch`));
    }
  }

  return canonicalPayload;
}

async function fetchJson(fetcher: NonNullable<RefreshCatalogOptions['fetcher']>, url: string): Promise<unknown> {
  let response: Pick<Response, 'ok' | 'status' | 'json'>;
  try {
    response = await fetcher(url);
  } catch (error) {
    throw new CatalogRefreshError('network', error);
  }

  if (!response.ok) {
    throw new CatalogRefreshError('network', new Error(`HTTP ${response.status}`));
  }

  try {
    return await response.json();
  } catch (error) {
    throw new CatalogRefreshError('invalid-data', error);
  }
}

function parseManifestEnvelope(json: unknown): SignedCatalogEnvelope<CatalogManifest> {
  if (isPlainObject(json) && isPlainObject(json.payload)) {
    const schemaVersion = json.payload.schema_version;
    if (typeof schemaVersion === 'number' && schemaVersion > 1) {
      const minimumAppVersion = typeof json.payload.minimum_app_version === 'string' ? json.payload.minimum_app_version : 'a newer version';
      throw new CatalogRefreshError(
        'schema-version',
        new Error(`Unsupported catalog schema ${schemaVersion}`),
        `This pack requires TileKeeper v${minimumAppVersion} or later. Update the app to review and install this catalog.`,
      );
    }
  }

  try {
    const envelope = signedCatalogEnvelopeSchema(catalogManifestSchema).parse(json);
    return envelope as SignedCatalogEnvelope<CatalogManifest>;
  } catch (error) {
    throw new CatalogRefreshError('invalid-data', error);
  }
}

function parsePackEnvelope(json: unknown): SignedCatalogEnvelope<CatalogPack> {
  if (isPlainObject(json) && isPlainObject(json.payload)) {
    const schemaVersion = json.payload.schema_version;
    if (typeof schemaVersion === 'number' && schemaVersion > 1) {
      const minimumAppVersion = typeof json.payload.minimum_app_version === 'string' ? json.payload.minimum_app_version : 'a newer version';
      throw new CatalogRefreshError(
        'schema-version',
        new Error(`Unsupported pack schema ${schemaVersion}`),
        `This pack requires TileKeeper v${minimumAppVersion} or later. Update the app to review and install this catalog.`,
      );
    }
  }

  try {
    const envelope = signedCatalogEnvelopeSchema(catalogPackSchema).parse(json);
    return envelope as SignedCatalogEnvelope<CatalogPack>;
  } catch (error) {
    throw new CatalogRefreshError('invalid-data', error);
  }
}

function bindSql(db: TileKeeperDatabase, sql: string, params: unknown[]): Promise<unknown> {
  if (!db.runAsync) {
    throw new CatalogRefreshError('storage', new Error('Database adapter does not support writes'));
  }
  return db.runAsync(sql, params);
}

async function runInTransaction(db: TileKeeperDatabase, task: () => Promise<void>): Promise<void> {
  if (db.withTransactionAsync) {
    await db.withTransactionAsync(task);
    return;
  }

  await db.execAsync('BEGIN');
  try {
    await task();
    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

async function upsertDownloadedPack(db: TileKeeperDatabase, envelope: SignedCatalogEnvelope<CatalogPack>, canonicalPackJson: string): Promise<number> {
  const pack = envelope.payload;
  await bindSql(
    db,
    `INSERT INTO catalog_packs (id, version, pack_json, sha256, signature, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET
       version = excluded.version,
       pack_json = excluded.pack_json,
       sha256 = excluded.sha256,
       signature = excluded.signature,
       updated_at = CURRENT_TIMESTAMP`,
    [pack.id, pack.version, canonicalPackJson, envelope.sha256, envelope.signature ?? null],
  );

  for (const tile of pack.tiles as TileType[]) {
    const parsedTile = tileTypeSchema.parse(tile);
    await bindSql(
      db,
      `INSERT INTO tile_types (id, slug, category, catalog_status, catalog_version, tile_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         slug = excluded.slug,
         category = excluded.category,
         catalog_status = excluded.catalog_status,
         catalog_version = excluded.catalog_version,
         tile_json = excluded.tile_json,
         updated_at = CURRENT_TIMESTAMP`,
      [
        parsedTile.id,
        parsedTile.id,
        parsedTile.category,
        parsedTile.catalog_status,
        parsedTile.catalog_version,
        JSON.stringify(parsedTile),
      ],
    );
  }

  return pack.tiles.length;
}

function normalizeCatalogRefreshError(error: unknown): CatalogRefreshError {
  if (error instanceof CatalogRefreshError) {
    return error;
  }
  if (error instanceof z.ZodError) {
    return new CatalogRefreshError('invalid-data', error);
  }
  return new CatalogRefreshError('storage', error);
}

export async function refreshCatalogFromManifest(options: RefreshCatalogOptions): Promise<CatalogRefreshResult> {
  const fetcher = options.fetcher ?? fetch;
  const configuredVerifier = options.signature ? await createConfiguredSignatureVerifier(options.signature) : undefined;
  const signatureVerifier = options.signatureVerifier ?? configuredVerifier;

  try {
    const manifestEnvelope = parseManifestEnvelope(await fetchJson(fetcher, options.manifestUrl));
    await assertEnvelopeIntegrity(manifestEnvelope, 'manifest', signatureVerifier);

    const downloadedPacks: Array<{ envelope: SignedCatalogEnvelope<CatalogPack>; canonicalPackJson: string }> = [];

    for (const packReference of manifestEnvelope.payload.packs) {
      const packEnvelope = parsePackEnvelope(await fetchJson(fetcher, packReference.url));
      const canonicalPackJson = await assertEnvelopeIntegrity(packEnvelope, 'pack', signatureVerifier);

      if (packEnvelope.payload.id !== packReference.id || packEnvelope.payload.version !== packReference.version) {
        throw new CatalogRefreshError('integrity', new Error(`Pack metadata mismatch for ${packReference.id}`));
      }

      if (packEnvelope.sha256.toLowerCase() !== packReference.sha256.toLowerCase()) {
        throw new CatalogRefreshError('integrity', new Error(`Pack reference checksum mismatch for ${packReference.id}`));
      }

      if (packReference.signature && packEnvelope.signature !== packReference.signature) {
        throw new CatalogRefreshError('integrity', new Error(`Pack reference signature mismatch for ${packReference.id}`));
      }

      downloadedPacks.push({ envelope: packEnvelope, canonicalPackJson });
    }

    let tilesUpserted = 0;
    await runInTransaction(options.db, async () => {
      for (const downloadedPack of downloadedPacks) {
        tilesUpserted += await upsertDownloadedPack(options.db, downloadedPack.envelope, downloadedPack.canonicalPackJson);
      }
    });

    return {
      refreshedPackIds: downloadedPacks.map(({ envelope }) => envelope.payload.id),
      tilesUpserted,
      catalogVersion: manifestEnvelope.payload.catalog_version,
    };
  } catch (error) {
    throw normalizeCatalogRefreshError(error);
  }
}
