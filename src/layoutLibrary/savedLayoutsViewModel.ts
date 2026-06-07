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

function includesSearchText(layout: SavedLayoutLibraryItem, searchText: string): boolean {
  const needle = searchText.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [layout.name, layout.goal, layout.notes ?? '', ...layout.tags].join(' ').toLowerCase();
  return haystack.includes(needle);
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
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

function toRow(layout: SavedLayoutLibraryItem): SavedLayoutRow {
  return {
    ...layout,
    title: layout.name,
    subtitle: `${layout.placement_count} tiles • updated ${formatUpdatedDate(layout.updated_at)} • ${layout.solver_version}`,
    tagLabels: layout.tags,
    isFavourite: layout.favourite,
  };
}

export function buildSavedLayoutsViewModel(layouts: SavedLayoutLibraryItem[], filters: SavedLayoutFilters): SavedLayoutsViewModel {
  const rows = filterSavedLayouts(layouts, filters)
    .slice()
    .sort((left, right) => Date.parse(right.updated_at) - Date.parse(left.updated_at))
    .map(toRow);
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
