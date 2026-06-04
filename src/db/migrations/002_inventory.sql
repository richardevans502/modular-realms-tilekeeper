PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_inventory (
  tile_type_id TEXT PRIMARY KEY,
  owned_quantity INTEGER NOT NULL DEFAULT 0 CHECK (owned_quantity >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  item_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (reserved <= owned_quantity),
  FOREIGN KEY (tile_type_id) REFERENCES tile_types(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_tile_type_id ON user_inventory(tile_type_id);

INSERT OR IGNORE INTO migration_log (id, schema_version, product_version)
VALUES ('002_inventory', 2, '0.2');