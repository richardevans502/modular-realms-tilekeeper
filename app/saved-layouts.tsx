import { SavedLayoutsScreen } from '../src/layoutLibrary/SavedLayoutsScreen';
import type { SavedLayoutLibraryItem } from '../src/layoutLibrary/savedLayoutsViewModel';

const demoSavedLayouts: SavedLayoutLibraryItem[] = [
  {
    id: 'layout-harbour-docks',
    name: 'Harbour Docks Skirmish',
    goal: 'Waterside route with removable bridge and scatter cover.',
    notes: 'Session three backup map. Fits the small dining table setup.',
    tags: ['water', 'bridge', 'skirmish'],
    favourite: true,
    created_at: '2026-06-03T15:45:00.000Z',
    updated_at: '2026-06-04T15:45:00.000Z',
    placement_count: 9,
    catalog_version: '2026.06',
    solver_version: 'solver-0.4',
  },
  {
    id: 'layout-goblin-fortress',
    name: 'Goblin Fortress Raid',
    goal: 'Two-room fortress with a guarded courtyard and one breach point.',
    notes: 'Campaign finale table, storage box A.',
    tags: ['campaign', 'fortress', 'large'],
    favourite: true,
    created_at: '2026-06-01T18:30:00.000Z',
    updated_at: '2026-06-02T09:00:00.000Z',
    placement_count: 14,
    catalog_version: '2026.06',
    solver_version: 'solver-0.4',
  },
  {
    id: 'layout-crystal-cavern',
    name: 'Crystal Cavern Ambush',
    goal: 'Compact cave encounter using scatter crystals and a narrow choke point.',
    notes: 'Quick-build intro encounter.',
    tags: ['cave', 'scatter', 'compact'],
    favourite: false,
    created_at: '2026-05-28T12:00:00.000Z',
    updated_at: '2026-05-29T12:00:00.000Z',
    placement_count: 7,
    catalog_version: '2026.06',
    solver_version: 'solver-0.4',
  },
];

export default function SavedLayoutsRoute() {
  return <SavedLayoutsScreen layouts={demoSavedLayouts} />;
}
