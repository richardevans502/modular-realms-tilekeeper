import { DatabaseSync } from 'node:sqlite';

import { buildCatalogPublication, type CatalogPackBuildInput } from './catalogPackBuilder';
import { refreshCatalogFromManifest, type SignedCatalogEnvelope } from './catalogRefresh';
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
  id: 'mr-maintenance-floor-1',
  name: 'Maintenance Floor',
  product_set: 'Catalog Maintenance Pack',
  dimensions: {
    unit: 'grid-cell',
    width: 1,
    height: 1,
    grid_cells: [{ x: 0, y: 0 }],
  },
  faces: [
    {
      face_id: 'face-a-stone',
      face_name: 'Stone',
      role_tags: ['floor'],
      edge_sockets: [
        { face: 'north', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to floor' },
        { face: 'east', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to floor' },
        { face: 'south', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to floor' },
        { face: 'west', socket_type: 'open-floor', bidirectional: true, reason: 'floor edge connects to floor' },
      ],
      rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
      theme_tags: ['stone', 'floor'],
    },
  ],
  catalog_status: 'official',
  category: 'floor',
  tags: ['maintenance'],
  catalog_version: '2026.06.maintenance',
  notes: 'Fixture tile for catalog maintenance workflow.',
};

async function openCatalogDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const db = new NodeSqliteAdapter(sqlite);
  await runMigrations(db);
  return { db, catalog: createCatalogRepository(db) };
}

describe('catalog pack builder', () => {
  test('builds a signed manifest and pack that the app can consume without a code release', async () => {
    const publication = await buildCatalogPublication({
      catalogVersion: '2026.06.maintenance',
      generatedAt: '2026-06-19T12:00:00.000Z',
      baseUrl: 'https://catalog.example/releases/2026.06.maintenance/',
      packs: [
        {
          id: 'maintenance-fixture',
          version: '2026.06.19',
          tiles: [tile],
          sources: [{ label: 'Manual fixture source', url: 'https://example.test/source', accessed_at: '2026-06-19' }],
          assets: [{ id: 'maintenance-map', type: 'image', url: 'https://example.test/map.png', sha256: 'a'.repeat(64), alt: 'Fixture art reference' }],
        },
      ],
      signature: 'test-signature',
    });

    expect(publication.manifestPath).toBe('manifest.json');
    expect(publication.files['manifest.json']).toEqual(publication.manifestEnvelope);
    expect(publication.files['packs/maintenance-fixture.json']).toEqual(publication.packEnvelopes[0]);
    expect(publication.manifestEnvelope.payload.packs).toEqual([
      {
        id: 'maintenance-fixture',
        version: '2026.06.19',
        url: 'https://catalog.example/releases/2026.06.maintenance/packs/maintenance-fixture.json',
        sha256: publication.packEnvelopes[0].sha256,
        signature: 'test-signature',
      },
    ]);
    expect(publication.packEnvelopes[0].payload).toMatchObject({
      schema_version: 1,
      id: 'maintenance-fixture',
      version: '2026.06.19',
      sources: [{ label: 'Manual fixture source' }],
      assets: [{ id: 'maintenance-map' }],
    });

    const { db, catalog } = await openCatalogDb();
    const fetcher = jest.fn(async (url: string) => {
      if (url.endsWith('/manifest.json')) return { ok: true, status: 200, json: async () => publication.manifestEnvelope } as Response;
      if (url.endsWith('/packs/maintenance-fixture.json')) return { ok: true, status: 200, json: async () => publication.packEnvelopes[0] } as Response;
      throw new Error(`unexpected url ${url}`);
    });

    await expect(
      refreshCatalogFromManifest({
        manifestUrl: 'https://catalog.example/releases/2026.06.maintenance/manifest.json',
        db,
        fetcher,
        signatureVerifier: async ({ signature }) => signature === 'test-signature',
      }),
    ).resolves.toEqual({ refreshedPackIds: ['maintenance-fixture'], tilesUpserted: 1, catalogVersion: '2026.06.maintenance' });
    await expect(catalog.getTileType(tile.id)).resolves.toEqual(tile);
  });

  test('builds HMAC signatures that the refresh verifier accepts', async () => {
    const secret = 'catalog-maintenance-secret';
    const publication = await buildCatalogPublication({
      catalogVersion: '2026.06.hmac',
      generatedAt: '2026-06-19T12:45:00.000Z',
      baseUrl: 'https://catalog.example/releases/2026.06.hmac/',
      hmacSecret: secret,
      packs: [{ id: 'hmac-pack', version: '2026.06.19', tiles: [tile] }],
    });
    const { db, catalog } = await openCatalogDb();

    await refreshCatalogFromManifest({
      manifestUrl: 'https://catalog.example/releases/2026.06.hmac/manifest.json',
      db,
      fetcher: async (url: string) =>
        ({
          ok: true,
          status: 200,
          json: async () => (url.endsWith('/manifest.json') ? publication.manifestEnvelope : publication.packEnvelopes[0]),
        }) as Response,
      signature: { algorithm: 'hmac-sha256', secret },
    });

    await expect(catalog.getTileType(tile.id)).resolves.toEqual(tile);
  });

  test('migrates legacy seed tile records into versioned pack tiles and records the migration', async () => {
    const legacyTile = {
      tile_type_id: 'mr-legacy-floor-1',
      official_name: 'Legacy Floor',
      product_set_name: 'Legacy Pack',
      dimensions: tile.dimensions,
      faces: tile.faces,
      theme_tags: ['legacy', 'floor'],
      category: 'floor',
      catalog_status: 'official',
      catalog_version: '2026.06.legacy',
      notes: 'Pre-v1 seed shape.',
    };
    const input: CatalogPackBuildInput = {
      id: 'legacy-pack',
      version: '2026.06.19',
      legacyTiles: [legacyTile],
    };

    const publication = await buildCatalogPublication({
      catalogVersion: '2026.06.legacy',
      generatedAt: '2026-06-19T12:30:00.000Z',
      baseUrl: 'https://catalog.example/releases/2026.06.legacy/',
      packs: [input],
    });
    const pack = publication.packEnvelopes[0].payload;

    expect(pack.tiles).toEqual([
      {
        id: 'mr-legacy-floor-1',
        name: 'Legacy Floor',
        product_set: 'Legacy Pack',
        dimensions: tile.dimensions,
        faces: tile.faces,
        catalog_status: 'official',
        category: 'floor',
        tags: ['legacy', 'floor'],
        catalog_version: '2026.06.legacy',
        notes: 'Pre-v1 seed shape.',
      },
    ]);
    expect(pack.migrations).toEqual([
      {
        id: 'legacy-seed-v0-to-pack-v1',
        from_schema_version: 0,
        to_schema_version: 1,
        applied_at: '2026-06-19T12:30:00.000Z',
        notes: 'Mapped legacy seed fields tile_type_id/official_name/product_set_name/theme_tags into TileType id/name/product_set/tags.',
      },
    ]);
  });
});
