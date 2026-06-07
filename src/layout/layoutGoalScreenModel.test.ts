import {
  DEFAULT_LAYOUT_GOAL_FORM,
  buildLayoutGoalRequest,
  getConstraintSummaries,
  updateLayoutGoalField,
  validateLayoutGoalForm,
} from './layoutGoalScreenModel';

describe('layout goal screen model', () => {
  test('starts with safe default bounds, constraints, seed, and goal copy', () => {
    expect(DEFAULT_LAYOUT_GOAL_FORM).toEqual({
      width: '5',
      height: '5',
      targetPlacements: '12',
      seed: 'keeper-demo-seed',
      goal: 'Balanced dungeon layout with traversable rooms and doorway continuity.',
    });
    expect(getConstraintSummaries(DEFAULT_LAYOUT_GOAL_FORM)).toEqual([
      'Bounds: 5 × 5 grid cells',
      'Target: 12 tile placements',
      'Seed: keeper-demo-seed',
      'Goal: Balanced dungeon layout with traversable rooms and doorway continuity.',
    ]);
  });

  test('normalises numeric fields and validates layout generation input', () => {
    const form = updateLayoutGoalField(DEFAULT_LAYOUT_GOAL_FORM, 'width', ' 7 rooms ');
    const next = updateLayoutGoalField(form, 'targetPlacements', '18 tiles');

    expect(next.width).toBe('7');
    expect(next.targetPlacements).toBe('18');
    expect(validateLayoutGoalForm(next)).toEqual([]);
    expect(buildLayoutGoalRequest(next, '2026-06-07T10:00:00.000Z')).toEqual({
      bounds: { width: 7, height: 5 },
      targetPlacements: 18,
      seed: 'keeper-demo-seed',
      goal: 'Balanced dungeon layout with traversable rooms and doorway continuity.',
      createdAt: '2026-06-07T10:00:00.000Z',
    });
  });

  test('reports all invalid bounds, constraint, seed, and goal problems before generate', () => {
    const invalidForm = {
      width: '0',
      height: '41',
      targetPlacements: '51',
      seed: '',
      goal: 'tiny',
    };

    expect(validateLayoutGoalForm(invalidForm)).toEqual([
      'Width must be between 1 and 40 grid cells.',
      'Height must be between 1 and 40 grid cells.',
      'Target placements must be between 1 and 50 tiles.',
      'Seed is required for deterministic generation.',
      'Goal must be at least 8 characters so the solver brief is meaningful.',
    ]);
    expect(() => buildLayoutGoalRequest(invalidForm, '2026-06-07T10:00:00.000Z')).toThrow(
      'Cannot build layout goal request from invalid form',
    );
  });
});
