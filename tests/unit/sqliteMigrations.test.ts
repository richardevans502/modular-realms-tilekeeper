import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  INITIAL_SQLITE_MIGRATION,
  SQLITE_MIGRATIONS,
  buildMigrationPlan,
} from '../../src/storage/migrations.ts';

test('v0.1 migration exposes a deterministic initial SQLite migration', () => {
  assert.equal(INITIAL_SQLITE_MIGRATION.id, '0001_initial_sqlite_v0_1');
  assert.equal(INITIAL_SQLITE_MIGRATION.schemaVersion, 1);
  assert.equal(INITIAL_SQLITE_MIGRATION.productVersion, '0.1');
  assert.equal(SQLITE_MIGRATIONS.length, 1);
  assert.deepEqual(buildMigrationPlan(0).map((migration) => migration.id), [
    '0001_initial_sqlite_v0_1',
  ]);
  assert.deepEqual(buildMigrationPlan(1), []);
});

test('v0.1 migration creates the architecture baseline tables and indexes', () => {
  const sql = INITIAL_SQLITE_MIGRATION.sql.join('\n');

  for (const tableName of [
    'migration_log',
    'app_settings',
    'catalog_packs',
    'tile_types',
    'inventory_items',
    'custom_tile_types',
    'saved_layouts',
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName}\\b`));
  }

  for (const indexName of [
    'idx_tile_types_slug',
    'idx_tile_types_category',
    'idx_inventory_items_tile_type_id',
    'idx_saved_layouts_updated_at',
  ]) {
    assert.match(sql, new RegExp(`CREATE INDEX IF NOT EXISTS ${indexName}\\b`));
  }
});

test('v0.1 migration preserves local-first data as validated JSON text with integrity constraints', () => {
  const sql = INITIAL_SQLITE_MIGRATION.sql.join('\n');

  assert.match(sql, /inventory_items[\s\S]*quantity_owned INTEGER NOT NULL DEFAULT 0 CHECK \(quantity_owned >= 0\)/);
  assert.match(sql, /catalog_packs[\s\S]*pack_json TEXT NOT NULL/);
  assert.match(sql, /tile_types[\s\S]*tile_json TEXT NOT NULL/);
  assert.match(sql, /custom_tile_types[\s\S]*tile_json TEXT NOT NULL/);
  assert.match(sql, /saved_layouts[\s\S]*layout_json TEXT NOT NULL/);
  assert.match(sql, /app_settings[\s\S]*value_json TEXT NOT NULL/);
  assert.match(sql, /FOREIGN KEY \(tile_type_id\) REFERENCES tile_types\(id\) ON DELETE RESTRICT/);
});

test('v0.1 migration records itself exactly once for idempotent startup runs', () => {
  const sql = INITIAL_SQLITE_MIGRATION.sql.join('\n');

  assert.match(sql, /INSERT OR IGNORE INTO migration_log/);
  assert.match(sql, /0001_initial_sqlite_v0_1/);
  assert.match(sql, /schema_version, product_version/);
});
