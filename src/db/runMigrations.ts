export interface TileKeeperDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  getAllAsync?<T>(sql: string, params?: unknown[]): Promise<T[]>;
  runAsync?(sql: string, params?: unknown[]): Promise<unknown>;
  withTransactionAsync?(task: () => Promise<void>): Promise<void>;
}

export interface DbMigration {
  id: string;
  schemaVersion: number;
  productVersion: string;
  sql: string;
}

export const INITIAL_MIGRATION_SQL = `PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS migration_log (
  id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  product_version TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalog_packs (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  pack_json TEXT NOT NULL,
  sha256 TEXT,
  signature TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tile_types (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  catalog_status TEXT NOT NULL,
  catalog_version TEXT NOT NULL,
  tile_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  tile_type_id TEXT NOT NULL,
  quantity_owned INTEGER NOT NULL DEFAULT 0 CHECK (quantity_owned >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  item_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (reserved <= quantity_owned),
  FOREIGN KEY (tile_type_id) REFERENCES tile_types(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS custom_tile_types (
  id TEXT PRIMARY KEY,
  tile_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_layouts (
  id TEXT PRIMARY KEY,
  catalog_version TEXT NOT NULL,
  solver_version TEXT NOT NULL,
  layout_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tile_types_slug ON tile_types(slug);
CREATE INDEX IF NOT EXISTS idx_tile_types_category ON tile_types(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tile_type_id ON inventory_items(tile_type_id);
CREATE INDEX IF NOT EXISTS idx_saved_layouts_updated_at ON saved_layouts(updated_at);

INSERT OR IGNORE INTO migration_log (id, schema_version, product_version)
VALUES ('001_initial', 1, '0.1');`;

export const INITIAL_MIGRATION: DbMigration = {
  id: '001_initial',
  schemaVersion: 1,
  productVersion: '0.1',
  sql: INITIAL_MIGRATION_SQL,
};

export const MIGRATIONS: DbMigration[] = [INITIAL_MIGRATION];

const MIGRATION_LOG_BOOTSTRAP_SQL = `CREATE TABLE IF NOT EXISTS migration_log (
  id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL,
  product_version TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export function buildMigrationPlan(appliedIds: ReadonlySet<string>): DbMigration[] {
  return MIGRATIONS.filter((migration) => !appliedIds.has(migration.id)).sort(
    (left, right) => left.schemaVersion - right.schemaVersion || left.id.localeCompare(right.id),
  );
}

export async function getAppliedMigrationIds(db: TileKeeperDatabase): Promise<Set<string>> {
  await db.execAsync(MIGRATION_LOG_BOOTSTRAP_SQL);

  if (db.getAllAsync) {
    const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM migration_log ORDER BY schema_version, id');
    return new Set(rows.map((row) => row.id));
  }

  const row = await db.getFirstAsync<{ ids: string | null }>(
    "SELECT group_concat(id, ',') AS ids FROM (SELECT id FROM migration_log ORDER BY schema_version, id)",
  );
  return new Set(row?.ids ? row.ids.split(',') : []);
}

export async function getSchemaVersion(db: TileKeeperDatabase): Promise<number> {
  await db.execAsync(MIGRATION_LOG_BOOTSTRAP_SQL);
  const row = await db.getFirstAsync<{ schema_version: number | null }>(
    'SELECT MAX(schema_version) AS schema_version FROM migration_log',
  );
  return row?.schema_version ?? 0;
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

export async function runMigrations(db: TileKeeperDatabase): Promise<void> {
  const appliedIds = await getAppliedMigrationIds(db);
  const plan = buildMigrationPlan(appliedIds);

  for (const migration of plan) {
    await runInTransaction(db, async () => {
      await db.execAsync(migration.sql);
    });
  }
}
