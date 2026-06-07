export interface LayoutGoalForm {
  width: string;
  height: string;
  targetPlacements: string;
  seed: string;
  goal: string;
}

export interface LayoutGoalRequest {
  bounds: { width: number; height: number };
  targetPlacements: number;
  seed: string;
  goal: string;
  createdAt: string;
}

export const DEFAULT_LAYOUT_GOAL_FORM: LayoutGoalForm = {
  width: '5',
  height: '5',
  targetPlacements: '12',
  seed: 'keeper-demo-seed',
  goal: 'Balanced dungeon layout with traversable rooms and doorway continuity.',
};

const numericFields = new Set<keyof LayoutGoalForm>(['width', 'height', 'targetPlacements']);

export function updateLayoutGoalField(form: LayoutGoalForm, field: keyof LayoutGoalForm, value: string): LayoutGoalForm {
  const nextValue = numericFields.has(field) ? value.replace(/\D+/g, '') : value;
  return { ...form, [field]: nextValue };
}

function parsePositiveInteger(value: string): number | undefined {
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function validateLayoutGoalForm(form: LayoutGoalForm): string[] {
  const errors: string[] = [];
  const width = parsePositiveInteger(form.width);
  const height = parsePositiveInteger(form.height);
  const targetPlacements = parsePositiveInteger(form.targetPlacements);

  if (width === undefined || width < 1 || width > 40) errors.push('Width must be between 1 and 40 grid cells.');
  if (height === undefined || height < 1 || height > 40) errors.push('Height must be between 1 and 40 grid cells.');
  if (targetPlacements === undefined || targetPlacements < 1 || targetPlacements > 50) {
    errors.push('Target placements must be between 1 and 50 tiles.');
  }
  if (!form.seed.trim()) errors.push('Seed is required for deterministic generation.');
  if (form.goal.trim().length < 8) errors.push('Goal must be at least 8 characters so the solver brief is meaningful.');

  return errors;
}

export function buildLayoutGoalRequest(form: LayoutGoalForm, createdAt: string): LayoutGoalRequest {
  const errors = validateLayoutGoalForm(form);
  if (errors.length > 0) throw new Error('Cannot build layout goal request from invalid form');

  return {
    bounds: { width: Number(form.width), height: Number(form.height) },
    targetPlacements: Number(form.targetPlacements),
    seed: form.seed.trim(),
    goal: form.goal.trim(),
    createdAt,
  };
}

export function getConstraintSummaries(form: LayoutGoalForm): string[] {
  return [
    `Bounds: ${form.width || '—'} × ${form.height || '—'} grid cells`,
    `Target: ${form.targetPlacements || '—'} tile placements`,
    `Seed: ${form.seed || '—'}`,
    `Goal: ${form.goal || '—'}`,
  ];
}
