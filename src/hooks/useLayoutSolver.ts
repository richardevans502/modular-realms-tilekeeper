import { useCallback, useEffect, useRef, useState } from 'react';

import { solveTopRankedLayouts, type RankedLayoutResult, type SolveTopRankedLayoutsOptions, type SolveTopRankedLayoutsResult } from '../layout/layoutSolver';
import type { LayoutGoalRequiredCategory } from '../layout/layoutGoalScreenModel';
import type { InventoryItem, Layout, TileType } from '../shared/types';

export interface LayoutSolverGoalConfig {
  bounds: { width: number; height: number };
  targetPlacements: number;
  seed: string;
  goal: string;
  themeTags: string[];
  requiredCategories: LayoutGoalRequiredCategory[];
}

export interface LayoutSolverOptions extends SolveTopRankedLayoutsOptions {
  topN?: number;
}

export interface RunLayoutSolverInput {
  catalog: TileType[];
  inventory: InventoryItem[];
  goal: LayoutSolverGoalConfig;
  createdAt?: string;
  signal?: AbortSignal;
  solver?: (options: { createdAt: string }) => SolveTopRankedLayoutsResult;
  options?: LayoutSolverOptions;
}

export interface RunLayoutSolverSuccess {
  layouts: RankedLayoutResult[];
  cacheKey: string;
  fromCache: boolean;
}

export interface UseLayoutSolverInput {
  catalog: TileType[];
  inventory: InventoryItem[];
  goal: LayoutSolverGoalConfig | null;
  options?: LayoutSolverOptions;
  onSolved?: (layout: Layout, layouts: RankedLayoutResult[]) => void;
}

export interface UseLayoutSolverState {
  layouts: RankedLayoutResult[];
  isLoading: boolean;
  error: string | null;
  generate: () => Promise<RunLayoutSolverSuccess | null>;
  cancel: () => void;
}

interface CachedSolverResult {
  layouts: RankedLayoutResult[];
  createdAt: string;
}

const solverResultCache = new Map<string, CachedSolverResult>();
const generatedLayoutsById = new Map<string, Layout>();

export class LayoutSolveCancelledError extends Error {
  constructor() {
    super('Layout solve was cancelled.');
    this.name = 'LayoutSolveCancelledError';
  }
}

export async function runLayoutSolver(input: RunLayoutSolverInput): Promise<RunLayoutSolverSuccess> {
  throwIfCancelled(input.signal);

  const cacheKey = buildLayoutSolverCacheKey(input.goal);
  const cached = solverResultCache.get(cacheKey);
  if (cached) {
    return { layouts: cached.layouts, cacheKey, fromCache: true };
  }

  await nextTick();
  throwIfCancelled(input.signal);

  const createdAt = input.createdAt ?? new Date().toISOString();
  const result = input.solver
    ? input.solver({ createdAt })
    : solveTopRankedLayouts(
        {
          catalog: input.catalog,
          inventory: input.inventory,
          bounds: input.goal.bounds,
          targetPlacements: input.goal.targetPlacements,
          seed: input.goal.seed,
          goal: input.goal.goal,
          createdAt,
        },
        { topN: input.options?.topN ?? 3, maxSearchNodes: input.options?.maxSearchNodes, maxExploredStates: input.options?.maxExploredStates, timeoutMs: input.options?.timeoutMs, maxBacktrackDepth: input.options?.maxBacktrackDepth },
      );

  throwIfCancelled(input.signal);

  if (!result.ok) {
    throw new Error(solverFailureMessage(result.reason));
  }
  if (result.layouts.length === 0) {
    throw new Error('Solver could not produce a layout from the current inventory and constraints.');
  }

  const cachedResult = { layouts: result.layouts, createdAt };
  solverResultCache.set(cacheKey, cachedResult);
  result.layouts.forEach((ranked) => generatedLayoutsById.set(ranked.layout.id, ranked.layout));

  return { layouts: result.layouts, cacheKey, fromCache: false };
}

export function useLayoutSolver({ catalog, inventory, goal, options, onSolved }: UseLayoutSolverInput): UseLayoutSolverState {
  const [layouts, setLayouts] = useState<RankedLayoutResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (mountedRef.current) {
      setIsLoading(false);
    }
  }, []);

  const generate = useCallback(async () => {
    if (!goal) {
      setError('Complete the layout goal before generating.');
      return null;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const result = await runLayoutSolver({ catalog, inventory, goal, signal: controller.signal, options });
      if (!mountedRef.current || controller.signal.aborted) return null;

      setLayouts(result.layouts);
      const bestLayout = result.layouts[0]?.layout;
      if (bestLayout) {
        onSolved?.(bestLayout, result.layouts);
      }
      return result;
    } catch (caught) {
      if (!mountedRef.current || controller.signal.aborted || caught instanceof LayoutSolveCancelledError) {
        return null;
      }
      const message = caught instanceof Error ? caught.message : 'Solver failed for an unknown reason.';
      setError(message);
      setLayouts([]);
      return null;
    } finally {
      if (mountedRef.current && abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [catalog, goal, inventory, onSolved, options]);

  return { layouts, isLoading, error, generate, cancel };
}

export function buildLayoutSolverCacheKey(goal: LayoutSolverGoalConfig): string {
  const payload = JSON.stringify({
    bounds: goal.bounds,
    targetPlacements: goal.targetPlacements,
    goal: goal.goal.trim(),
    themeTags: [...goal.themeTags].sort(),
    requiredCategories: [...goal.requiredCategories].sort(),
  });
  return `${goal.seed.trim()}:${hashString(payload)}`;
}

export function getCachedSolvedLayout(layoutId: string | string[] | undefined): Layout | null {
  const id = Array.isArray(layoutId) ? layoutId[0] : layoutId;
  if (!id) return null;
  return generatedLayoutsById.get(id) ?? null;
}

export function clearLayoutSolverCache(): void {
  solverResultCache.clear();
  generatedLayoutsById.clear();
}

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function throwIfCancelled(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new LayoutSolveCancelledError();
  }
}

function solverFailureMessage(reason: 'no-available-inventory' | 'invalid-bounds'): string {
  if (reason === 'invalid-bounds') {
    return 'Solver rejected the current bounds. Choose a positive width and height, then try again.';
  }
  return 'Solver cannot run because no inventory is available for placement.';
}

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
