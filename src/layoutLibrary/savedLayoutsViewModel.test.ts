import {
  buildSavedLayoutsViewModel,
  filterSavedLayouts,
  type SavedLayoutLibraryItem,
} from './savedLayoutsViewModel';

const layouts: SavedLayoutLibraryItem[] = [
  {
    id: 'layout-fortress',
    name: 'Goblin Fortress Raid',
    goal: 'Two-room fortress with a guarded courtyard',
    notes: 'Campaign finale table, storage box A',
    tags: ['campaign', 'fortress', 'large'],
    favourite: true,
    created_at: '2026-06-01T18:30:00.000Z',
    updated_at: '2026-06-02T09:00:00.000Z',
    placement_count: 14,
    catalog_version: '2026.06',
    solver_version: 'solver-0.4',
  },
  {
    id: 'layout-cavern',
    name: 'Crystal Cavern Ambush',
    goal: 'Compact cave encounter',
    notes: 'Uses scatter crystals',
    tags: ['cave', 'scatter'],
    favourite: false,
    created_at: '2026-05-28T12:00:00.000Z',
    updated_at: '2026-05-29T12:00:00.000Z',
    placement_count: 7,
    catalog_version: '2026.06',
    solver_version: 'solver-0.4',
  },
  {
    id: 'layout-docks',
    name: 'Harbour Docks Skirmish',
    goal: 'Waterside route with removable bridge',
    notes: 'Session three backup map',
    tags: ['water', 'bridge'],
    favourite: true,
    created_at: '2026-06-03T15:45:00.000Z',
    updated_at: '2026-06-04T15:45:00.000Z',
    placement_count: 9,
    catalog_version: '2026.06',
    solver_version: 'solver-0.4',
  },
];

describe('saved layouts library view model', () => {
  test('filters by search text across name, goal, notes, and tags', () => {
    expect(filterSavedLayouts(layouts, { searchText: 'fortress', selectedTags: [], favouritesOnly: false }).map((row) => row.id)).toEqual([
      'layout-fortress',
    ]);
    expect(filterSavedLayouts(layouts, { searchText: 'session three', selectedTags: [], favouritesOnly: false }).map((row) => row.id)).toEqual([
      'layout-docks',
    ]);
    expect(filterSavedLayouts(layouts, { searchText: 'scatter', selectedTags: [], favouritesOnly: false }).map((row) => row.id)).toEqual([
      'layout-cavern',
    ]);
  });

  test('filters favourites and requires every selected tag', () => {
    expect(filterSavedLayouts(layouts, { searchText: '', selectedTags: ['water'], favouritesOnly: true }).map((row) => row.id)).toEqual([
      'layout-docks',
    ]);
    expect(filterSavedLayouts(layouts, { searchText: '', selectedTags: ['campaign', 'large'], favouritesOnly: false }).map((row) => row.id)).toEqual([
      'layout-fortress',
    ]);
    expect(filterSavedLayouts(layouts, { searchText: '', selectedTags: ['cave'], favouritesOnly: true })).toEqual([]);
  });

  test('builds sorted rows, tag chips, counts, and empty-state copy', () => {
    const viewModel = buildSavedLayoutsViewModel(layouts, {
      searchText: '',
      selectedTags: [],
      favouritesOnly: false,
    });

    expect(viewModel.rows.map((row) => row.id)).toEqual(['layout-docks', 'layout-fortress', 'layout-cavern']);
    expect(viewModel.totalCount).toBe(3);
    expect(viewModel.favouriteCount).toBe(2);
    expect(viewModel.availableTags.map((tag) => tag.label)).toEqual(['bridge', 'campaign', 'cave', 'fortress', 'large', 'scatter', 'water']);
    expect(viewModel.rows[0]).toMatchObject({
      title: 'Harbour Docks Skirmish',
      subtitle: '9 tiles • updated 4 Jun 2026 • solver-0.4',
      tagLabels: ['water', 'bridge'],
      isFavourite: true,
    });
    expect(viewModel.emptyState).toBeUndefined();
  });

  test('returns helpful empty-state copy when filters hide every layout', () => {
    const viewModel = buildSavedLayoutsViewModel(layouts, {
      searchText: 'dragon',
      selectedTags: ['cave'],
      favouritesOnly: true,
    });

    expect(viewModel.rows).toEqual([]);
    expect(viewModel.emptyState).toEqual({
      title: 'No saved layouts match',
      message: 'Try clearing the search, tag chips, or favourites-only filter.',
    });
  });
});
