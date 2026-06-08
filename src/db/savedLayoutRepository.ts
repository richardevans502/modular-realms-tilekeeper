import { z } from 'zod';

import { layoutSchema } from '../shared/schemas';
import type { Layout } from '../shared/types';
import type { TileKeeperDatabase } from './runMigrations';

export interface SavedLayout {
  id: string;
  name: string;
  layout: Layout;
  tags: string[];
  favourite: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedLayoutListFilters {
  tags?: string[];
  favouritesOnly?: boolean;
}

export type SavedLayoutUpdate = Partial<Pick<SavedLayout, 'name' | 'layout' | 'tags' | 'favourite' | 'notes' | 'updated_at'>>;

export interface SavedLayoutRepository {
  createLayout(layout: SavedLayout): Promise<void>;
  upsertLayout(layout: SavedLayout): Promise<void>;
  updateLayout(id: string, patch: SavedLayoutUpdate): Promise<SavedLayout>;
  deleteLayout(id: string): Promise<boolean>;
  getLayout(id: string): Promise<SavedLayout | null>;
  listLayouts(filters?: SavedLayoutListFilters): Promise<SavedLayout[]>;
}

interface SavedLayoutRow {
  id: string;
  name: string;
  layout_json: string;
  tags_json: string;
  favourite: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const tagsSchema = z.array(z.string().min(1));
const savedLayoutSchema: z.ZodType<SavedLayout> = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    layout: layoutSchema,
    tags: tagsSchema,
    favourite: z.boolean(),
    notes: z.string().optional(),
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .strict();

function parseLayoutJson(layoutJson: string): Layout {
  return layoutSchema.parse(JSON.parse(layoutJson)) as Layout;
}

function parseTagsJson(tagsJson: string): string[] {
  return tagsSchema.parse(JSON.parse(tagsJson));
}

function rowToSavedLayout(row: SavedLayoutRow): SavedLayout {
  const parsed: SavedLayout = {
    id: row.id,
    name: row.name,
    layout: parseLayoutJson(row.layout_json),
    tags: parseTagsJson(row.tags_json),
    favourite: row.favourite === 1,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
  return savedLayoutSchema.parse(parsed);
}

function validateSavedLayout(layout: SavedLayout): SavedLayout {
  return savedLayoutSchema.parse(layout);
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function matchesFilters(layout: SavedLayout, filters?: SavedLayoutListFilters): boolean {
  if (!filters) return true;
  if (filters.favouritesOnly && !layout.favourite) return false;

  const selectedTags = (filters.tags ?? []).map(normalizeTag);
  if (selectedTags.length === 0) return true;

  const layoutTags = new Set(layout.tags.map(normalizeTag));
  return selectedTags.every((tag) => layoutTags.has(tag));
}

function sortSavedLayouts(left: SavedLayout, right: SavedLayout): number {
  return Date.parse(right.updated_at) - Date.parse(left.updated_at) || left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
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

async function writeLayout(db: TileKeeperDatabase, layout: SavedLayout): Promise<void> {
  const parsedLayout = validateSavedLayout(layout);
  await bindSql(
    db,
    `INSERT INTO saved_layouts (
       id, name, catalog_version, solver_version, layout_json, tags_json, favourite, notes, created_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       catalog_version = excluded.catalog_version,
       solver_version = excluded.solver_version,
       layout_json = excluded.layout_json,
       tags_json = excluded.tags_json,
       favourite = excluded.favourite,
       notes = excluded.notes,
       created_at = excluded.created_at,
       updated_at = excluded.updated_at`,
    [
      parsedLayout.id,
      parsedLayout.name,
      parsedLayout.layout.catalog_version,
      parsedLayout.layout.solver_version,
      JSON.stringify(parsedLayout.layout),
      JSON.stringify(parsedLayout.tags),
      parsedLayout.favourite ? 1 : 0,
      parsedLayout.notes ?? null,
      parsedLayout.created_at,
      parsedLayout.updated_at,
    ],
  );
}

export function createSavedLayoutRepository(db: TileKeeperDatabase): SavedLayoutRepository {
  async function getLayout(id: string): Promise<SavedLayout | null> {
    const row = await db.getFirstAsync<SavedLayoutRow>(
      'SELECT id, name, layout_json, tags_json, favourite, notes, created_at, updated_at FROM saved_layouts WHERE id = ?',
      [id],
    );
    if (!row) {
      return null;
    }
    return rowToSavedLayout(row);
  }

  async function listLayouts(filters?: SavedLayoutListFilters): Promise<SavedLayout[]> {
    const sql = 'SELECT id, name, layout_json, tags_json, favourite, notes, created_at, updated_at FROM saved_layouts';
    const rows = db.getAllAsync
      ? await db.getAllAsync<SavedLayoutRow>(sql)
      : await readRowsWithoutGetAll(db);

    return rows.map(rowToSavedLayout).filter((layout) => matchesFilters(layout, filters)).sort(sortSavedLayouts);
  }

  async function readRowsWithoutGetAll(database: TileKeeperDatabase): Promise<SavedLayoutRow[]> {
    const row = await database.getFirstAsync<{ rows_json: string | null }>(
      `SELECT '[' || group_concat(json_object(
        'id', id,
        'name', name,
        'layout_json', layout_json,
        'tags_json', tags_json,
        'favourite', favourite,
        'notes', notes,
        'created_at', created_at,
        'updated_at', updated_at
      )) || ']' AS rows_json FROM saved_layouts`,
    );
    return JSON.parse(row?.rows_json ?? '[]') as SavedLayoutRow[];
  }

  return {
    async createLayout(layout: SavedLayout): Promise<void> {
      const parsedLayout = validateSavedLayout(layout);
      if (await layoutExists(db, parsedLayout.id)) {
        throw new Error(`Saved layout '${parsedLayout.id}' already exists`);
      }
      await writeLayout(db, parsedLayout);
    },

    async upsertLayout(layout: SavedLayout): Promise<void> {
      await writeLayout(db, layout);
    },

    async updateLayout(id: string, patch: SavedLayoutUpdate): Promise<SavedLayout> {
      const existing = await getLayout(id);
      if (!existing) {
        throw new Error(`Saved layout '${id}' does not exist`);
      }

      const nextLayout = validateSavedLayout({ ...existing, ...patch, id });
      await writeLayout(db, nextLayout);
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
