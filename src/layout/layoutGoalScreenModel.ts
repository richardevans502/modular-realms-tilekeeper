import type { InventoryItem, TileType } from '../shared/types';

export type LayoutGoalRequiredCategory = 'floor' | 'wall' | 'doorway' | 'corridor';

export interface LayoutGoalForm {
  width: string;
  height: string;
  targetPlacements: string;
  themeTags: string[];
  requiredCategories: LayoutGoalRequiredCategory[];
  seed: string;
  goal: string;
}

export interface LayoutGoalRequest {
  bounds: { width: number; height: number };
  targetPlacements: number;
  themeTags: string[];
  requiredCategories: LayoutGoalRequiredCategory[];
  seed: string;
  goal: string;
  createdAt: string;
}

export const LAYOUT_GOAL_BOUNDS = { min: 2, max: 20 } as const;
export const LAYOUT_GOAL_TARGET_TILE_COUNT = { min: 4, max: 50 } as const;
export const LAYOUT_GOAL_REQUIRED_CATEGORIES: LayoutGoalRequiredCategory[] = ['floor', 'wall', 'doorway', 'corridor'];

export const DEFAULT_LAYOUT_GOAL_FORM: LayoutGoalForm = {
  width: '8',
  height: '8',
  targetPlacements: '12',
  themeTags: [],
  requiredCategories: [...LAYOUT_GOAL_REQUIRED_CATEGORIES],
  seed: 'keeper-demo-seed',
  goal: 'Balanced dungeon layout with traversable rooms and doorway continuity.',
};

const numericFields = new Set<keyof LayoutGoalForm>(['width', 'height', 'targetPlacements']);

export function updateLayoutGoalField(form: LayoutGoalForm, field: keyof LayoutGoalForm, value: string): LayoutGoalForm {
  const nextValue = numericFields.has(field) ? value.replace(/\D+/g, '') : value;
  return { ...form, [field]: nextValue };
}

export function incrementLayoutGoalNumber(
  form: LayoutGoalForm,
  field: 'width' | 'height' | 'targetPlacements',
  delta: number,
): LayoutGoalForm {
  const range = field === 'targetPlacements' ? LAYOUT_GOAL_TARGET_TILE_COUNT : LAYOUT_GOAL_BOUNDS;
  const current = parsePositiveInteger(form[field]) ?? range.min;
  const nextValue = Math.min(range.max, Math.max(range.min, current + delta));
  return { ...form, [field]: String(nextValue) };
}

export function toggleLayoutGoalTheme(form: LayoutGoalForm, themeTag: string): LayoutGoalForm {
  const normalisedTheme = themeTag.trim();
  if (!normalisedTheme) return form;
  const selected = form.themeTags.includes(normalisedTheme);
  return {
    ...form,
    themeTags: selected
      ? form.themeTags.filter((tag) => tag !== normalisedTheme)
      : [...form.themeTags, normalisedTheme].sort((left, right) => left.localeCompare(right)),
  };
}

export function toggleLayoutGoalCategory(form: LayoutGoalForm, category: LayoutGoalRequiredCategory): LayoutGoalForm {
  const selected = form.requiredCategories.includes(category);
  return {
    ...form,
    requiredCategories: selected
      ? form.requiredCategories.filter((candidate) => candidate !== category)
      : [...form.requiredCategories, category].sort(compareRequiredCategories),
  };
}

export function buildSeed(now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `keeper-${stamp}-${random}`;
}

export function deriveThemeOptions(catalog: TileType[]): string[] {
  return [...new Set(catalog.flatMap((tile) => tile.faces.flatMap((face) => face.theme_tags)))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function hasAvailableInventory(inventory: InventoryItem[]): boolean {
  return inventory.some((item) => Math.max(0, item.owned_quantity - item.reserved) > 0);
}

function parsePositiveInteger(value: string): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function validateLayoutGoalForm(form: LayoutGoalForm, inventory?: InventoryItem[]): string[] {
  const errors: string[] = [];
  const width = parsePositiveInteger(form.width);
  const height = parsePositiveInteger(form.height);
  const targetPlacements = parsePositiveInteger(form.targetPlacements);

  if (width === undefined || width < LAYOUT_GOAL_BOUNDS.min || width > LAYOUT_GOAL_BOUNDS.max) {
    errors.push('Width must be between 2 and 20 grid cells.');
  }
  if (height === undefined || height < LAYOUT_GOAL_BOUNDS.min || height > LAYOUT_GOAL_BOUNDS.max) {
    errors.push('Height must be between 2 and 20 grid cells.');
  }
  if (
    targetPlacements === undefined ||
    targetPlacements < LAYOUT_GOAL_TARGET_TILE_COUNT.min ||
    targetPlacements > LAYOUT_GOAL_TARGET_TILE_COUNT.max
  ) {
    errors.push('Target tile count must be between 4 and 50 tiles.');
  }
  if (form.requiredCategories.length === 0) errors.push('Select at least one required category.');
  if (!form.seed.trim()) errors.push('Seed is required for deterministic generation.');
  if (form.goal.trim().length < 8) errors.push('Goal must be at least 8 characters so the solver brief is meaningful.');
  if (inventory !== undefined && !hasAvailableInventory(inventory)) errors.push('Add inventory before generating a layout goal.');

  return errors;
}

export function buildLayoutGoalRequest(form: LayoutGoalForm, createdAt: string): LayoutGoalRequest {
  const errors = validateLayoutGoalForm(form);
  if (errors.length > 0) throw new Error('Cannot build layout goal request from invalid form');

  return {
    bounds: { width: Number(form.width), height: Number(form.height) },
    targetPlacements: Number(form.targetPlacements),
    themeTags: [...form.themeTags],
    requiredCategories: [...form.requiredCategories],
    seed: form.seed.trim(),
    goal: form.goal.trim(),
    createdAt,
  };
}

export function getConstraintSummaries(form: LayoutGoalForm): string[] {
  return [
    `Bounds: ${form.width || '—'} × ${form.height || '—'} grid cells`,
    `Target: ${form.targetPlacements || '—'} tile placements`,
    `Themes: ${form.themeTags.length > 0 ? form.themeTags.join(', ') : 'any catalog theme'}`,
    `Required categories: ${form.requiredCategories.length > 0 ? form.requiredCategories.join(', ') : 'none selected'}`,
    `Seed: ${form.seed || '—'}`,
  ];
}

function compareRequiredCategories(left: LayoutGoalRequiredCategory, right: LayoutGoalRequiredCategory): number {
  return LAYOUT_GOAL_REQUIRED_CATEGORIES.indexOf(left) - LAYOUT_GOAL_REQUIRED_CATEGORIES.indexOf(right);
}
