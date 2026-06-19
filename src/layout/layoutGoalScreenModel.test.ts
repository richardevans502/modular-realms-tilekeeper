import type { InventoryItem, TileType } from '../shared/types';
import {
  DEFAULT_LAYOUT_GOAL_FORM,
  buildLayoutGoalRequest,
  buildSeed,
  deriveThemeOptions,
  getConstraintSummaries,
  hasAvailableInventory,
  toggleLayoutGoalCategory,
  toggleLayoutGoalTheme,
  updateLayoutGoalField,
  validateLayoutGoalForm,
} from './layoutGoalScreenModel';

const catalogFixture: TileType[] = [
  {
    id: 'floor-1',
    name: 'Cracked Wood Floor',
    product_set: 'seed',
    dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
    faces: [
      {
        face_id: 'front',
        face_name: 'Front',
        role_tags: ['floor', 'corridor'],
        edge_sockets: [],
        rotation_rules: { allowed_rotations: [0, 90, 180, 270], flip_allowed: true },
        theme_tags: ['wood', 'dungeon'],
      },
    ],
    catalog_status: 'official',
    category: 'floor',
    tags: ['starter'],
    catalog_version: '0.1',
  },
  {
    id: 'door-1',
    name: 'Stone Door',
    product_set: 'seed',
    dimensions: { unit: 'grid-cell', width: 1, height: 1, grid_cells: [{ x: 0, y: 0 }] },
    faces: [
      {
        face_id: 'front',
        face_name: 'Front',
        role_tags: ['doorway'],
        edge_sockets: [],
        rotation_rules: { allowed_rotations: [0, 180], flip_allowed: false },
        theme_tags: ['stone', 'dungeon'],
      },
    ],
    catalog_status: 'official',
    category: 'doorway',
    tags: ['starter'],
    catalog_version: '0.1',
  },
];

const inventoryFixture: InventoryItem[] = [
  { tile_type_id: 'floor-1', owned_quantity: 2, condition: 'good' },
  { tile_type_id: 'door-1', owned_quantity: 1, condition: 'good' },
];

describe('layout goal screen model', () => {
  test('starts with accepted setup bounds, theme filters, required categories, seed, and goal copy', () => {
    expect(DEFAULT_LAYOUT_GOAL_FORM).toEqual({
      width: '8',
      height: '8',
      targetPlacements: '12',
      themeTags: [],
      requiredCategories: ['floor', 'wall', 'doorway', 'corridor'],
      seed: 'keeper-demo-seed',
      goal: 'Balanced dungeon layout with traversable rooms and doorway continuity.',
    });
    expect(getConstraintSummaries(DEFAULT_LAYOUT_GOAL_FORM)).toEqual([
      'Bounds: 8 × 8 grid cells',
      'Target: 12 tile placements',
      'Themes: any catalog theme',
      'Required categories: floor, wall, doorway, corridor',
      'Seed: keeper-demo-seed',
    ]);
  });

  test('normalises numeric fields and validates layout generation input within required ranges', () => {
    const sized = updateLayoutGoalField(DEFAULT_LAYOUT_GOAL_FORM, 'width', ' 20 rooms ');
    const targeted = updateLayoutGoalField(sized, 'targetPlacements', '50 tiles');
    const themed = toggleLayoutGoalTheme(targeted, 'dungeon');
    const categoryToggled = toggleLayoutGoalCategory(themed, 'corridor');

    expect(categoryToggled.width).toBe('20');
    expect(categoryToggled.targetPlacements).toBe('50');
    expect(categoryToggled.themeTags).toEqual(['dungeon']);
    expect(categoryToggled.requiredCategories).toEqual(['floor', 'wall', 'doorway']);
    expect(validateLayoutGoalForm(categoryToggled, inventoryFixture)).toEqual([]);
    expect(buildLayoutGoalRequest(categoryToggled, '2026-06-07T10:00:00.000Z')).toEqual({
      bounds: { width: 20, height: 8 },
      targetPlacements: 50,
      themeTags: ['dungeon'],
      requiredCategories: ['floor', 'wall', 'doorway'],
      seed: 'keeper-demo-seed',
      goal: 'Balanced dungeon layout with traversable rooms and doorway continuity.',
      createdAt: '2026-06-07T10:00:00.000Z',
    });
  });

  test('reports invalid bounds, target count, empty inventory, seed, and goal problems before generate', () => {
    const invalidForm = {
      width: '1',
      height: '21',
      targetPlacements: '3',
      themeTags: [],
      requiredCategories: [],
      seed: '',
      goal: 'tiny',
    };

    expect(validateLayoutGoalForm(invalidForm, [])).toEqual([
      'Width must be between 2 and 20 grid cells.',
      'Height must be between 2 and 20 grid cells.',
      'Target tile count must be between 4 and 50 tiles.',
      'Select at least one required category.',
      'Seed is required for deterministic generation.',
      'Goal must be at least 8 characters so the solver brief is meaningful.',
      'Add inventory before generating a layout goal.',
    ]);
    expect(() => buildLayoutGoalRequest(invalidForm, '2026-06-07T10:00:00.000Z')).toThrow(
      'Cannot build layout goal request from invalid form',
    );
  });

  test('derives unique sorted theme options and recognises available inventory after reservations', () => {
    expect(deriveThemeOptions(catalogFixture)).toEqual(['dungeon', 'stone', 'wood']);
    expect(hasAvailableInventory(inventoryFixture)).toBe(true);
    expect(hasAvailableInventory([{ tile_type_id: 'door-1', owned_quantity: 0, condition: 'good' }])).toBe(false);
    expect(buildSeed()).not.toEqual(buildSeed());
  });
});
