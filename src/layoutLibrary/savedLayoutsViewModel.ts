import type { SavedLayout } from '../db/savedLayoutRepository';
import type { GridCell, Layout, TileType } from '../shared/types';

export interface SavedLayoutLibraryItem {
  id: string;
  name: string;
  goal: string;
  notes?: string;
  tags: string[];
  favourite: boolean;
  created_at: string;
  updated_at: string;
  placement_count: number;
  catalog_version: string;
  solver_version: string;
  referencedTileIds?: string[];
  thumbnailCells?: GridCell[];
}

export type SavedLayoutCatalogWarningKind = 'missing' | 'discontinued';

export interface SavedLayoutCatalogWarning {
  tile_type_id: string;
  kind: SavedLayoutCatalogWarningKind;
  message: string;
}

export interface SavedLayoutFilters {
  searchText: string;
  selectedTags: string[];
  favouritesOnly: boolean;
}

export type SavedLayoutsFilterState = SavedLayoutFilters;

export interface SavedLayoutRow extends SavedLayoutLibraryItem {
  title: string;
  subtitle: string;
  tagLabels: string[];
  isFavourite: boolean;
  catalogWarnings: SavedLayoutCatalogWarning[];
  warningBadge?: 'Catalog warning';
}

export interface SavedLayoutTagChip {
  label: string;
  selected: boolean;
  count: number;
}

export interface SavedLayoutsViewModel {
  rows: SavedLayoutRow[];
  availableTags: SavedLayoutTagChip[];
  totalCount: number;
  filteredCount: number;
  favouriteCount: number;
  emptyState?: { title: string; message: string };
}

export interface SavedLayoutsBuildOptions {
  catalogTiles?: TileType[];
}

function includesSearchText(layout: SavedLayoutLibraryItem, searchText: string): boolean {
  const needle = searchText.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [layout.name, layout.goal, layout.notes ?? '', ...layout.tags].join(' ').toLowerCase();
  return haystack.includes(needle);
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function titleFromGoal(goal: string, id: string): string {
  const firstLine = goal.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return firstLine ?? id;
}

function notesFromGoal(goal: string): string | undefined {
  const rest = goal.split(/\r?\n/).slice(1).map((line) => line.trim()).filter(Boolean).join(' ');
  return rest || undefined;
}

function tagsFromLayout(layout: Layout): string[] {
  const tags = new Set<string>();
  for (const placement of layout.placements) {
    tags.add(normalizeTag(placement.tile_type_id));
  }
  return Array.from(tags).sort((left, right) => left.localeCompare(right));
}

function isSavedLayoutRecord(layout: Layout | SavedLayout): layout is SavedLayout {
  return 'layout' in layout;
}

function uniqueTileIds(layout: Layout): string[] {
  return Array.from(new Set(layout.placements.map((placement) => placement.tile_type_id))).sort((left, right) => left.localeCompare(right));
}

export function toSavedLayoutLibraryItem(layoutRecord: Layout | SavedLayout, favouriteIds?: ReadonlySet<string>): SavedLayoutLibraryItem {
  if (isSavedLayoutRecord(layoutRecord)) {
    const layout = layoutRecord.layout;
    return {
      id: layoutRecord.id,
      name: layoutRecord.name,
      goal: layout.goal,
      notes: layoutRecord.notes,
      tags: layoutRecord.tags.map(normalizeTag).sort((left, right) => left.localeCompare(right)),
      favourite: favouriteIds ? favouriteIds.has(layoutRecord.id) : layoutRecord.favourite,
      created_at: layoutRecord.created_at,
      updated_at: layoutRecord.updated_at,
      placement_count: layout.placements.length,
      catalog_version: layout.catalog_version,
      solver_version: layout.solver_version,
      referencedTileIds: uniqueTileIds(layout),
      thumbnailCells: layout.placements.flatMap((placement) => placement.grid_cells),
    };
  }

  return {
    id: layoutRecord.id,
    name: titleFromGoal(layoutRecord.goal, layoutRecord.id),
    goal: layoutRecord.goal,
    notes: notesFromGoal(layoutRecord.goal),
    tags: tagsFromLayout(layoutRecord),
    favourite: favouriteIds?.has(layoutRecord.id) ?? false,
    created_at: layoutRecord.created_at,
    updated_at: layoutRecord.created_at,
    placement_count: layoutRecord.placements.length,
    catalog_version: layoutRecord.catalog_version,
    solver_version: layoutRecord.solver_version,
    referencedTileIds: uniqueTileIds(layoutRecord),
    thumbnailCells: layoutRecord.placements.flatMap((placement) => placement.grid_cells),
  };
}

export function filterSavedLayouts(layouts: SavedLayoutLibraryItem[], filters: SavedLayoutFilters): SavedLayoutLibraryItem[] {
  const selectedTags = filters.selectedTags.map(normalizeTag);

  return layouts.filter((layout) => {
    if (filters.favouritesOnly && !layout.favourite) return false;
    const layoutTags = layout.tags.map(normalizeTag);
    if (!selectedTags.every((tag) => layoutTags.includes(tag))) return false;
    return includesSearchText(layout, filters.searchText);
  });
}

function formatUpdatedDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(isoDate));
}

function toRow(layout: SavedLayoutLibraryItem, catalogWarnings: SavedLayoutCatalogWarning[] = []): SavedLayoutRow {
  return {
    ...layout,
    title: layout.name,
    subtitle: `${layout.placement_count} tiles • updated ${formatUpdatedDate(layout.updated_at)} • ${layout.solver_version}`,
    tagLabels: layout.tags,
    isFavourite: layout.favourite,
    catalogWarnings,
    warningBadge: catalogWarnings.length > 0 ? 'Catalog warning' : undefined,
  };
}

function buildCatalogWarnings(layout: SavedLayoutLibraryItem, catalogTiles?: TileType[]): SavedLayoutCatalogWarning[] {
  if (!catalogTiles) {
    return [];
  }

  const catalogById = new Map(catalogTiles.map((tile) => [tile.id, tile]));
  return (layout.referencedTileIds ?? []).reduce<SavedLayoutCatalogWarning[]>((warnings, tileId) => {
    const tile = catalogById.get(tileId);
    if (!tile) {
      warnings.push({ tile_type_id: tileId, kind: 'missing', message: `${tileId} is no longer in the current catalog.` });
      return warnings;
    }
    if (tile.catalog_status === 'deprecated') {
      warnings.push({ tile_type_id: tileId, kind: 'discontinued', message: `${tile.name} has been discontinued in the current catalog.` });
    }
    return warnings;
  }, []);
}

export function buildSavedLayoutsViewModel(layouts: SavedLayoutLibraryItem[], filters: SavedLayoutFilters, options: SavedLayoutsBuildOptions = {}): SavedLayoutsViewModel {
  const rows = filterSavedLayouts(layouts, filters)
    .slice()
    .sort((left, right) => Date.parse(right.updated_at) - Date.parse(left.updated_at))
    .map((layout) => toRow(layout, buildCatalogWarnings(layout, options.catalogTiles)));
  const tagCounts = layouts.reduce((counts, layout) => {
    for (const tag of layout.tags) {
      const normalizedTag = normalizeTag(tag);
      counts.set(normalizedTag, (counts.get(normalizedTag) ?? 0) + 1);
    }
    return counts;
  }, new Map<string, number>());
  const allTags = Array.from(tagCounts.keys()).sort((left, right) => left.localeCompare(right));
  const selectedTags = new Set(filters.selectedTags.map(normalizeTag));

  return {
    rows,
    availableTags: allTags.map((label) => ({ label, selected: selectedTags.has(label), count: tagCounts.get(label) ?? 0 })),
    totalCount: layouts.length,
    filteredCount: rows.length,
    favouriteCount: layouts.filter((layout) => layout.favourite).length,
    emptyState: rows.length === 0 ? { title: 'No saved layouts match', message: 'Try clearing the search, tag chips, or favourites-only filter.' } : undefined,
  };
}
