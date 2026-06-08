import type { InventoryItem } from '../shared/types';
import type { LayoutSolverTrace, RejectedCandidate, SolveLayoutResult } from './layoutSolver';
import type { MissingTileReason, MissingTileSuggestion } from './missingTileSuggestions';

export interface SolverInsightStat {
  label: string;
  value: string;
  detail: string;
}

export interface SolverInsightBanner {
  title: string;
  tone: 'success' | 'warning' | 'error';
  message: string;
}

export interface RejectionBreakdownRow {
  reason: string;
  count: number;
}

export interface RejectedCandidateRowViewModel {
  id: string;
  title: string;
  detail: string;
  reason: string;
}

export interface MissingTileRowViewModel {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
}

export interface SolverInsightViewModel {
  statusBanner: SolverInsightBanner;
  foundSummary: string;
  traceSummary: SolverInsightStat[];
  rejectionBreakdown: RejectionBreakdownRow[];
  rejectedCandidateRows: RejectedCandidateRowViewModel[];
  missingTileRows: MissingTileRowViewModel[];
  emptySuggestionsMessage?: string;
}

export interface BuildSolverInsightViewModelInput {
  result: SolveLayoutResult;
  suggestions: MissingTileSuggestion[];
  inventory: InventoryItem[];
}

export function buildSolverInsightViewModel({
  result,
  suggestions,
  inventory,
}: BuildSolverInsightViewModelInput): SolverInsightViewModel {
  const trace = result.trace;
  const placedCount = result.ok ? result.layout.placements.length : 0;
  const requestedCount = trace.requestedPlacements;
  const missingCount = trace.missingRequestedPlacements;
  const rejectedCount = trace.rejectedCandidates.length;
  const availableCount = countAvailableInventory(inventory);
  const consumedCount = countRecordValues(trace.inventoryConsumed);
  const missingTileRows = suggestions.map(toMissingTileRow);

  return {
    statusBanner: buildStatusBanner(result, placedCount, requestedCount, missingCount),
    foundSummary: `${placedCount} of ${requestedCount} placements found`,
    traceSummary: [
      { label: 'Requested', value: String(requestedCount), detail: 'target placements' },
      { label: 'Placed', value: String(placedCount), detail: 'tiles on grid' },
      { label: 'Missing', value: String(missingCount), detail: 'unfilled requested slots' },
      { label: 'Rejected', value: String(rejectedCount), detail: 'candidate attempts' },
      { label: 'Consumed', value: `${consumedCount} / ${availableCount}`, detail: 'available inventory used' },
    ],
    rejectionBreakdown: buildRejectionBreakdown(trace.rejectedCandidates),
    rejectedCandidateRows: trace.rejectedCandidates.map(toRejectedCandidateRow),
    missingTileRows,
    emptySuggestionsMessage:
      missingTileRows.length === 0
        ? 'No missing tile suggestions — current inventory satisfies the layout request.'
        : undefined,
  };
}

function buildStatusBanner(
  result: SolveLayoutResult,
  placedCount: number,
  requestedCount: number,
  missingCount: number,
): SolverInsightBanner {
  if (!result.ok) {
    return {
      title: 'Layout generation blocked',
      tone: 'error',
      message: result.reason === 'invalid-bounds'
        ? 'Check the requested grid bounds and try again.'
        : 'Add available inventory before running the solver again.',
    };
  }

  if (missingCount > 0) {
    return {
      title: `Layout generated with ${missingCount} tile ${missingCount === 1 ? 'gap' : 'gaps'}`,
      tone: 'warning',
      message: `Placed ${placedCount} of ${requestedCount} requested tiles. Review the missing-tile suggestions before saving this layout.`,
    };
  }

  return {
    title: 'Layout generated successfully',
    tone: 'success',
    message: `Placed all ${requestedCount} requested tiles with the current inventory.`,
  };
}

function toRejectedCandidateRow(candidate: RejectedCandidate, index: number): RejectedCandidateRowViewModel {
  const reason = formatRejectedReason(candidate.reason);
  return {
    id: `${candidate.tile_type_id}-${candidate.face_id}-${candidate.x}-${candidate.y}-${candidate.rotation}-${index}`,
    title: `${candidate.tile_type_id} · ${candidate.face_id}`,
    detail: `Grid (${candidate.x}, ${candidate.y}) · ${candidate.rotation}° rotation`,
    reason,
  };
}

function buildRejectionBreakdown(rejectedCandidates: RejectedCandidate[]): RejectionBreakdownRow[] {
  const counts = new Map<string, number>();
  for (const candidate of rejectedCandidates) {
    const label = formatRejectedReason(candidate.reason);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([reason, count]) => ({ reason, count }));
}

function toMissingTileRow(suggestion: MissingTileSuggestion, index: number): MissingTileRowViewModel {
  return {
    id: suggestion.tile_type_id ?? `missing-${suggestion.category}-${index}`,
    title: suggestion.name,
    subtitle: buildMissingTileSubtitle(suggestion),
    badge: formatMissingReason(suggestion.reason),
  };
}

function buildMissingTileSubtitle(suggestion: MissingTileSuggestion): string {
  const quantityCopy = `Need ${suggestion.missing_quantity} ${suggestion.category} ${suggestion.missing_quantity === 1 ? 'tile' : 'tiles'}`;
  if (suggestion.reason === 'no-catalog-candidate') {
    return `${quantityCopy} • no catalog candidate exists yet`;
  }

  if (suggestion.matched_theme_tags.length > 0) {
    return `${quantityCopy} • best theme matches: ${suggestion.matched_theme_tags.join(', ')}`;
  }

  return `${quantityCopy} • add matching inventory or adjust constraints`;
}

function countAvailableInventory(inventory: InventoryItem[]): number {
  return inventory.reduce((total, item) => total + Math.max(0, item.owned_quantity - item.reserved), 0);
}

function countRecordValues(record: Record<string, number>): number {
  return Object.values(record).reduce((total, value) => total + value, 0);
}

function formatRejectedReason(reason: RejectedCandidate['reason']): string {
  return reason.replace(/-/g, ' ');
}

function formatMissingReason(reason: MissingTileReason): string {
  switch (reason) {
    case 'required-category-shortage':
      return 'category shortage';
    case 'required-tile-type-shortage':
      return 'tile shortage';
    case 'no-catalog-candidate':
      return 'catalog gap';
  }
}
