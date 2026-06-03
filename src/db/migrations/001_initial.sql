PRAGMA foreign_keys = ON;

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
VALUES ('001_initial', 1, '0.1');
