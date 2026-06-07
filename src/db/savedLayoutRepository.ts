import { layoutSchema } from '../shared/schemas';
import type { Layout } from '../shared/types';
import type { TileKeeperDatabase } from './runMigrations';

export interface SavedLayoutRepository {
  createLayout(layout: Layout): Promise<void>;
  upsertLayout(layout: Layout): Promise<void>;
  updateLayout(id: string, patch: Partial<Layout>): Promise<Layout>;
  deleteLayout(id: string): Promise<boolean>;
  getLayout(id: string): Promise<Layout | null>;
  listLayouts(): Promise<Layout[]>;
}

interface LayoutRow {
  layout_json: string;
}

function parseLayoutJson(layoutJson: string): Layout {
  return layoutSchema.parse(JSON.parse(layoutJson)) as Layout;
}

function bindSql(db: TileKeeperDatabase, sql: string, params: unknown[]): Promise<unknown> {
  if (!db.runAsync) {
    throw new Error('Database adapter does not support parameterized writes');
  }
  return db.runAsync(sql, params);
}

async function layoutExists(db: TileKeeperDatabase, id: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM saved_layouts WHERE id = ?', [id]);
  return row !== null;
}

export function createSavedLayoutRepository(db: TileKeeperDatabase): SavedLayoutRepository {
  async function upsertLayout(layout: Layout): Promise<void> {
    const parsedLayout = layoutSchema.parse(layout) as Layout;
    await bindSql(
      db,
      `INSERT INTO saved_layouts (id, catalog_version, solver_version, layout_json, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         catalog_version = excluded.catalog_version,
         solver_version = excluded.solver_version,
         layout_json = excluded.layout_json,
         updated_at = CURRENT_TIMESTAMP`,
      [
        parsedLayout.id,
        parsedLayout.catalog_version,
        parsedLayout.solver_version,
        JSON.stringify(parsedLayout),
      ],
    );
  }

  async function getLayout(id: string): Promise<Layout | null> {
    const row = await db.getFirstAsync<LayoutRow>('SELECT layout_json FROM saved_layouts WHERE id = ?', [id]);
    if (!row) {
      return null;
    }
    return parseLayoutJson(row.layout_json);
  }

  async function listLayouts(): Promise<Layout[]> {
    if (!db.getAllAsync) {
      const row = await db.getFirstAsync<{ layout_json: string | null }>(
        "SELECT '[' || group_concat(layout_json) || ']' AS layout_json FROM saved_layouts ORDER BY id",
      );
      const json = row?.layout_json ?? '[]';
      return (JSON.parse(json) as unknown[]).map((layout) => layoutSchema.parse(layout) as Layout);
    }

    const rows = await db.getAllAsync<LayoutRow>('SELECT layout_json FROM saved_layouts ORDER BY id');
    return rows.map((row) => parseLayoutJson(row.layout_json));
  }

  return {
    async createLayout(layout: Layout): Promise<void> {
      const parsedLayout = layoutSchema.parse(layout) as Layout;
      if (await layoutExists(db, parsedLayout.id)) {
        throw new Error(`Saved layout '${parsedLayout.id}' already exists`);
      }
      await upsertLayout(parsedLayout);
    },

    upsertLayout,

    async updateLayout(id: string, patch: Partial<Layout>): Promise<Layout> {
      const existing = await getLayout(id);
      if (!existing) {
        throw new Error(`Saved layout '${id}' does not exist`);
      }

      const nextLayout = layoutSchema.parse({ ...existing, ...patch, id }) as Layout;
      await upsertLayout(nextLayout);
      return nextLayout;
    },

    async deleteLayout(id: string): Promise<boolean> {
      if (!(await layoutExists(db, id))) {
        return false;
      }
      await bindSql(db, 'DELETE FROM saved_layouts WHERE id = ?', [id]);
      return true;
    },

    getLayout,
    listLayouts,
  };
}
