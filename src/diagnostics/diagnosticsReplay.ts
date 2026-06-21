import { SOLVER_VERSION, solveTopRankedLayouts, type SolveTopRankedLayoutsResult } from '../layout/layoutSolver';
import type { LocalDiagnosticLog } from './localDiagnostics';

export type DiagnosticsReplayResult =
  | {
      ok: true;
      generatedAt: string;
      solverVersion: string;
      catalogVersion: string;
      result: SolveTopRankedLayoutsResult;
      reason?: never;
    }
  | {
      ok: false;
      reason: 'missing-anonymized-fixture' | 'unsupported-schema-version';
      generatedAt?: string;
      solverVersion?: never;
      catalogVersion?: never;
      result?: never;
    };

export function replayDiagnosticsExport(log: LocalDiagnosticLog): DiagnosticsReplayResult {
  if (log.schemaVersion < 2) {
    return { ok: false, reason: 'unsupported-schema-version', generatedAt: log.generatedAt };
  }
  const fixture = log.anonymizedFixture;
  if (!fixture) {
    return { ok: false, reason: 'missing-anonymized-fixture', generatedAt: log.generatedAt };
  }

  const result = solveTopRankedLayouts(
    {
      catalog: fixture.catalog,
      inventory: fixture.inventory,
      bounds: fixture.solverInput.bounds,
      targetPlacements: fixture.solverInput.targetPlacements,
      seed: fixture.solverInput.seed,
      goal: fixture.solverInput.goal,
      createdAt: fixture.solverInput.createdAt,
    },
    { topN: 3 },
  );

  return {
    ok: true,
    generatedAt: log.generatedAt,
    solverVersion: fixture.solverVersion || log.solver.version || SOLVER_VERSION,
    catalogVersion: fixture.catalogVersion || log.catalog?.version || 'unknown',
    result,
  };
}
