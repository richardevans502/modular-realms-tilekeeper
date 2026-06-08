import {
  buildSavedLayoutsViewModel,
  filterSavedLayouts,
  toSavedLayoutLibraryItem,
  type SavedLayoutLibraryItem,
} from './savedLayoutsViewModel';

import type { SavedLayout } from '../db/savedLayoutRepository';
import type { Layout } from '../shared/types';

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

const repositoryLayout: Layout = {
  id: 'layout-repo-bridge',
  goal: 'Bridge choke point skirmish\nFast rebuild for act two.',
  seed: 'seed-bridge',
  catalog_version: '2026.06',
  solver_version: 'solver-0.5',
  created_at: '2026-06-06T10:15:00.000Z',
  placements: [
    { tile_type_id: 'stone-floor', face_id: 'front', x: 0, y: 0, rotation: 0, grid_cells: [{ x: 0, y: 0 }] },
    { tile_type_id: 'stone-floor', face_id: 'front', x: 1, y: 0, rotation: 90, grid_cells: [{ x: 1, y: 0 }] },
    { tile_type_id: 'bridge', face_id: 'span', x: 2, y: 0, rotation: 0, grid_cells: [{ x: 2, y: 0 }] },
  ],
};

const repositoryRecord: SavedLayout = {
  id: 'saved-bridge',
  name: 'Bridge Library Record',
  layout: repositoryLayout,
  tags: ['Skirmish', 'Bridge'],
  favourite: true,
  notes: 'Pinned for Friday night.',
  created_at: '2026-06-06T10:15:00.000Z',
  updated_at: '2026-06-07T09:00:00.000Z',
};

describe('saved layouts library view model', () => {
  test('maps SQLite repository saved-layout records into library cards', () => {
    expect(toSavedLayoutLibraryItem(repositoryRecord)).toEqual({
      id: 'saved-bridge',
      name: 'Bridge Library Record',
      goal: 'Bridge choke point skirmish\nFast rebuild for act two.',
      notes: 'Pinned for Friday night.',
      tags: ['bridge', 'skirmish'],
      favourite: true,
      created_at: '2026-06-06T10:15:00.000Z',
      updated_at: '2026-06-07T09:00:00.000Z',
      placement_count: 3,
      catalog_version: '2026.06',
      solver_version: 'solver-0.5',
      thumbnailCells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
    });
  });

  test('maps bare layout records into fallback library cards', () => {
    expect(toSavedLayoutLibraryItem(repositoryLayout, new Set(['layout-repo-bridge']))).toEqual({
      id: 'layout-repo-bridge',
      name: 'Bridge choke point skirmish',
      goal: 'Bridge choke point skirmish\nFast rebuild for act two.',
      notes: 'Fast rebuild for act two.',
      tags: ['bridge', 'stone-floor'],
      favourite: true,
      created_at: '2026-06-06T10:15:00.000Z',
      updated_at: '2026-06-06T10:15:00.000Z',
      placement_count: 3,
      catalog_version: '2026.06',
      solver_version: 'solver-0.5',
      thumbnailCells: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
    });
  });

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
