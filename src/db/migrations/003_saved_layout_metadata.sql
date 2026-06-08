ALTER TABLE saved_layouts ADD COLUMN name TEXT NOT NULL DEFAULT 'Untitled layout';
ALTER TABLE saved_layouts ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE saved_layouts ADD COLUMN notes TEXT;
ALTER TABLE saved_layouts ADD COLUMN favourite INTEGER NOT NULL DEFAULT 0 CHECK (favourite IN (0, 1));
ALTER TABLE saved_layouts ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_saved_layouts_name ON saved_layouts(name);
CREATE INDEX IF NOT EXISTS idx_saved_layouts_favourite ON saved_layouts(favourite);

INSERT OR IGNORE INTO migration_log (id, schema_version, product_version)
VALUES ('003_saved_layout_metadata', 3, '0.3');