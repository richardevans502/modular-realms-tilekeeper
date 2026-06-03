/** One idempotent SQLite schema migration for TileKeeper local-first storage. */
export interface SqliteMigration {
  /** Stable migration identifier recorded in migration_log. */
  id: string;
  /** Integer schema version reached after this migration is applied. */
  schemaVersion: number;
  /** Product version that introduced the migration. */
  productVersion: string;
  /** Ordered SQL statements to run inside the startup migration transaction. */
  sql: string[];
}

/** Initial v0.1 SQLite schema baseline for catalog, inventory, settings, and saved layouts. */
export const INITIAL_SQLITE_MIGRATION: SqliteMigration = {
  id: '0001_initial_sqlite_v0_1',
  schemaVersion: 1,
  productVersion: '0.1',
  sql: [
    `CREATE TABLE IF NOT EXISTS migration_log (
      id TEXT PRIMARY KEY,
      schema_version INTEGER NOT NULL,
      product_version TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS catalog_packs (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      pack_json TEXT NOT NULL,
      sha256 TEXT,
      signature TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tile_types (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      category TEXT NOT NULL,
      catalog_status TEXT NOT NULL,
      catalog_version TEXT NOT NULL,
      tile_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      tile_type_id TEXT NOT NULL,
      quantity_owned INTEGER NOT NULL DEFAULT 0 CHECK (quantity_owned >= 0),
      reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
      item_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tile_type_id) REFERENCES tile_types(id) ON DELETE RESTRICT
    )`,
    `CREATE TABLE IF NOT EXISTS custom_tile_types (
      id TEXT PRIMARY KEY,
      tile_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS saved_layouts (
      id TEXT PRIMARY KEY,
      catalog_version TEXT NOT NULL,
      solver_version TEXT NOT NULL,
      layout_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    'CREATE INDEX IF NOT EXISTS idx_tile_types_slug ON tile_types(slug)',
    'CREATE INDEX IF NOT EXISTS idx_tile_types_category ON tile_types(category)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_items_tile_type_id ON inventory_items(tile_type_id)',
    'CREATE INDEX IF NOT EXISTS idx_saved_layouts_updated_at ON saved_layouts(updated_at)',
    `INSERT OR IGNORE INTO migration_log (id, schema_version, product_version)
      VALUES ('0001_initial_sqlite_v0_1', 1, '0.1')`,
  ],
};

/** Ordered list of all known SQLite migrations. */
export const SQLITE_MIGRATIONS: SqliteMigration[] = [INITIAL_SQLITE_MIGRATION];

/** Builds the ordered migration plan needed to advance from the current schema version. */
export function buildMigrationPlan(currentSchemaVersion: number): SqliteMigration[] {
  return SQLITE_MIGRATIONS.filter((migration) => migration.schemaVersion > currentSchemaVersion);
}
