import { DatabaseSync } from 'node:sqlite';

import { refreshCatalogFromManifest, CatalogRefreshError, canonicalJson, sha256Hex } from './catalogRefresh';
import { createCatalogRepository } from '../db/catalogRepository';
import { runMigrations, type TileKeeperDatabase } from '../db/runMigrations';
import type { TileType } from '../shared/types';

class NodeSqliteAdapter implements TileKeeperDatabase {
  constructor(private readonly db: DatabaseSync) {}

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    return (this.db.prepare(sql).get(...(params as never[])) as T | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...(params as never[])) as T[];
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    this.db.prepare(sql).run(...(params as never[]));
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.db.exec('BEGIN');
    try {
      await task();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

const tile: TileType = {
  id: 'online-floor-1',
  name: 'Online Floor Tile',
  product_set: 'Online Starter Pack',
  dimensions: {
    unit: 'grid-cell',
    width: 1,
    height: 1,
    grid_cells: [{ x: 0, y: 0 }],
  },
  faces: [
    {
      face_id: 'face-stone',
      face_name: 'Stone',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
      theme_tags: ['stone'],
    },
  ],
  catalog_status: 'official',
  category: 'floor',
  tags: ['online'],
  catalog_version: '2026.06.catalog',
};

function response(json: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 503,
    json: async () => json,
  } as Response;
}

async function signedEnvelope(payload: unknown, signature = 'test-signature') {
  return {
    payload,
    sha256: await sha256Hex(canonicalJson(payload)),
    signature,
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

async function openCatalogDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const db = new NodeSqliteAdapter(sqlite);
  await runMigrations(db);
  return { sqlite, db, catalog: createCatalogRepository(db) };
}

describe('online catalog refresh', () => {
  test('fetches a signed manifest, validates downloads, and caches pack tiles without deleting existing catalog data', async () => {
    const { sqlite, db, catalog } = await openCatalogDb();
    const seedTile = { ...tile, id: 'seed-floor-1', name: 'Seed Floor' };
    await catalog.upsertTileType(seedTile);

    const packPayload = { id: 'starter-online', version: '2026.06.12', tiles: [tile] };
    const packEnvelope = await signedEnvelope(packPayload, 'pack-signature');
    const manifestPayload = {
      schema_version: 1,
      catalog_version: '2026.06.catalog',
      generated_at: '2026-06-12T10:00:00.000Z',
      packs: [{ id: packPayload.id, version: packPayload.version, url: 'https://catalog.example/packs/starter.json', sha256: packEnvelope.sha256, signature: packEnvelope.signature }],
    };
    const manifestEnvelope = await signedEnvelope(manifestPayload, 'manifest-signature');
    const fetcher = jest.fn(async (url: string) => {
      if (url === 'https://catalog.example/manifest.json') return response(manifestEnvelope);
      if (url === 'https://catalog.example/packs/starter.json') return response(packEnvelope);
      throw new Error(`unexpected url ${url}`);
    });

    const result = await refreshCatalogFromManifest({
      manifestUrl: 'https://catalog.example/manifest.json',
      db,
      fetcher,
      signatureVerifier: async ({ signature }) => signature === 'manifest-signature' || signature === 'pack-signature',
    });

    expect(result).toEqual({ refreshedPackIds: ['starter-online'], tilesUpserted: 1, catalogVersion: '2026.06.catalog' });
    await expect(catalog.getTileType(seedTile.id)).resolves.toEqual(seedTile);
    await expect(catalog.getTileType(tile.id)).resolves.toEqual(tile);
    expect(sqlite.prepare('SELECT id, version, sha256, signature FROM catalog_packs').all()).toEqual([
      { id: 'starter-online', version: '2026.06.12', sha256: packEnvelope.sha256, signature: 'pack-signature' },
    ]);
  });

  test('verifies HMAC-signed manifests and packs when configured with a shared secret', async () => {
    const { db, catalog } = await openCatalogDb();
    const secret = 'catalog-refresh-secret';
    const packPayload = { id: 'starter-online', version: '2026.06.12', tiles: [tile] };
    const packEnvelope = await signedEnvelope(packPayload, await hmacSignature(packPayload, secret));
    const manifestPayload = {
      schema_version: 1,
      catalog_version: '2026.06.catalog',
      generated_at: '2026-06-12T10:00:00.000Z',
      packs: [{ id: packPayload.id, version: packPayload.version, url: 'https://catalog.example/packs/starter.json', sha256: packEnvelope.sha256, signature: packEnvelope.signature }],
    };
    const manifestEnvelope = await signedEnvelope(manifestPayload, await hmacSignature(manifestPayload, secret));

    await refreshCatalogFromManifest({
      manifestUrl: 'https://catalog.example/manifest.json',
      db,
      fetcher: async (url: string) => response(url.includes('manifest') ? manifestEnvelope : packEnvelope),
      signature: { algorithm: 'hmac-sha256', secret },
    });

    await expect(catalog.getTileType(tile.id)).resolves.toEqual(tile);
  });

  test('turns network failures into a non-technical refresh error and keeps cached catalog data available', async () => {
    const { db, catalog } = await openCatalogDb();
    await catalog.upsertTileType(tile);

    await expect(
      refreshCatalogFromManifest({
        manifestUrl: 'https://catalog.example/manifest.json',
        db,
        fetcher: async () => {
          throw new Error('ENOTFOUND catalog.example');
        },
      }),
    ).rejects.toMatchObject({
      name: 'CatalogRefreshError',
      userMessage: 'Could not refresh the catalog. Your existing offline catalog is still available.',
    });
    await expect(catalog.getTileType(tile.id)).resolves.toEqual(tile);
  });

  test('rejects malformed manifests with a clear non-technical error', async () => {
    const { db } = await openCatalogDb();

    await expect(
      refreshCatalogFromManifest({
        manifestUrl: 'https://catalog.example/manifest.json',
        db,
        fetcher: async () => response({ payload: { packs: 'nope' }, sha256: 'not-a-real-checksum' }),
      }),
    ).rejects.toBeInstanceOf(CatalogRefreshError);
  });

  test('explains newer catalog schema versions instead of treating them as corrupt data', async () => {
    const { db } = await openCatalogDb();
    const manifestPayload = {
      schema_version: 2,
      minimum_app_version: '1.1',
      catalog_version: '2026.07.catalog',
      generated_at: '2026-07-01T10:00:00.000Z',
      packs: [],
    };
    const manifestEnvelope = await signedEnvelope(manifestPayload);

    await expect(
      refreshCatalogFromManifest({
        manifestUrl: 'https://catalog.example/manifest.json',
        db,
        fetcher: async () => response(manifestEnvelope),
      }),
    ).rejects.toMatchObject({
      name: 'CatalogRefreshError',
      kind: 'schema-version',
      userMessage: 'This pack requires TileKeeper v1.1 or later. Update the app to review and install this catalog.',
    });
  });

  test('rejects pack checksum mismatches before writing anything to SQLite', async () => {
    const { sqlite, db } = await openCatalogDb();
    const packPayload = { id: 'starter-online', version: '2026.06.12', tiles: [tile] };
    const packEnvelope = { payload: packPayload, sha256: '0'.repeat(64) };
    const manifestPayload = {
      schema_version: 1,
      catalog_version: '2026.06.catalog',
      generated_at: '2026-06-12T10:00:00.000Z',
      packs: [{ id: packPayload.id, version: packPayload.version, url: 'https://catalog.example/packs/starter.json', sha256: '0'.repeat(64) }],
    };
    const manifestEnvelope = await signedEnvelope(manifestPayload);

    await expect(
      refreshCatalogFromManifest({
        manifestUrl: 'https://catalog.example/manifest.json',
        db,
        fetcher: async (url: string) => response(url.includes('manifest') ? manifestEnvelope : packEnvelope),
      }),
    ).rejects.toMatchObject({ userMessage: 'The downloaded catalog could not be verified. Your existing offline catalog is unchanged.' });
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM catalog_packs').get()).toEqual({ count: 0 });
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM tile_types').get()).toEqual({ count: 0 });
  });
});
