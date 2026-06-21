import { SOLVER_VERSION } from '../layout/layoutSolver';
import type { InventoryItem, Layout, TileType } from '../shared/types';

export const DIAGNOSTICS_DECISION = {
  approach: 'local-only-diagnostics',
  approvedBy: 'labby-default-privacy-gate',
  approvedAt: '2026-06-12',
  rationale:
    'Use local-only diagnostic export until an explicit external crash reporter approval and DSN exist. This keeps support data opt-in, inspectable, and shareable by the user without sending inventory, layout, goal, seed, or device identifiers to a third party.',
} as const;

export const DIAGNOSTIC_LIMITS = {
  solverRuns: 25,
  navigationEvents: 25,
  errors: 25,
} as const;

export interface DiagnosticNavigationEvent {
  timestamp: string;
  route: string;
}

export interface DiagnosticErrorEvent {
  timestamp: string;
  message: string;
  name?: string;
  stack?: string;
  handled: boolean;
  context?: string;
}

export interface DiagnosticSolverRun {
  timestamp: string;
  solverVersion: string;
  durationMs: number;
  exploredStates: number;
  resultCount: number;
  fromCache: boolean;
  cancelled: boolean;
}

export interface DiagnosticAnonymizedLayoutFixture {
  issueKind: 'layout-generation' | 'layout-import';
  anonymizedAt: string;
  solverVersion: string;
  catalogVersion: string;
  catalog: TileType[];
  inventory: Pick<InventoryItem, 'tile_type_id' | 'owned_quantity' | 'condition'>[];
  solverInput: {
    bounds: { width: number; height: number };
    targetPlacements: number;
    seed: string;
    goal: string;
    createdAt: string;
  };
  expectedLayout?: Pick<Layout, 'placements' | 'solver_version' | 'catalog_version' | 'created_at'>;
}

export type AnonymizedLayoutFixture = DiagnosticAnonymizedLayoutFixture;

export interface LocalDiagnosticLog {
  schemaVersion: 1 | 2;
  generatedAt: string;
  collectionMode: 'local-only-opt-in';
  consent: {
    required: true;
    explanation: string;
    collected: string[];
    excluded: string[];
  };
  app: {
    name: string;
    version: string;
  };
  catalog: {
    version: string;
  };
  solver: {
    version: string;
    runs: DiagnosticSolverRun[];
  };
  navigation: {
    events: DiagnosticNavigationEvent[];
  };
  errors: DiagnosticErrorEvent[];
  anonymizedFixture?: DiagnosticAnonymizedLayoutFixture;
}

const solverRuns: DiagnosticSolverRun[] = [];
const navigationEvents: DiagnosticNavigationEvent[] = [];
const errorEvents: DiagnosticErrorEvent[] = [];
let lastCapturedRoute: string | null = null;

export function recordDiagnosticSolverRun(run: DiagnosticSolverRun): void {
  pushLimited(solverRuns, { ...run }, DIAGNOSTIC_LIMITS.solverRuns);
}

export function recordDiagnosticNavigation(route: string, timestamp = new Date().toISOString()): void {
  const normalizedRoute = normalizeRoute(route);
  if (!normalizedRoute || normalizedRoute === lastCapturedRoute) return;
  lastCapturedRoute = normalizedRoute;
  pushLimited(navigationEvents, { timestamp, route: normalizedRoute }, DIAGNOSTIC_LIMITS.navigationEvents);
}

export function recordDiagnosticError(error: unknown, options: { handled?: boolean; context?: string; timestamp?: string } = {}): void {
  const normalized = normalizeError(error);
  pushLimited(
    errorEvents,
    {
      timestamp: options.timestamp ?? new Date().toISOString(),
      message: normalized.message,
      name: normalized.name,
      stack: normalized.stack,
      handled: options.handled ?? true,
      context: options.context,
    },
    DIAGNOSTIC_LIMITS.errors,
  );
}

export function getDiagnosticNavigationEvents(): DiagnosticNavigationEvent[] {
  return navigationEvents.map((event) => ({ ...event }));
}

export function getDiagnosticErrors(): DiagnosticErrorEvent[] {
  return errorEvents.map((event) => ({ ...event }));
}

export function getDiagnosticSolverRuns(): DiagnosticSolverRun[] {
  return solverRuns.map((run) => ({ ...run }));
}

export function clearDiagnosticBuffers(): void {
  solverRuns.length = 0;
  navigationEvents.length = 0;
  errorEvents.length = 0;
  lastCapturedRoute = null;
}

export function buildAnonymizedLayoutFixture(options: {
  catalog: TileType[];
  inventory: InventoryItem[];
  bounds: { width: number; height: number };
  targetPlacements: number;
  issueKind: DiagnosticAnonymizedLayoutFixture['issueKind'];
  generatedAt?: string;
  solverVersion?: string;
  seed?: string;
  expectedLayout?: Layout;
}): DiagnosticAnonymizedLayoutFixture {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const tileIdMap = new Map<string, string>();
  const faceIdMap = new Map<string, string>();

  const anonymizedCatalog = options.catalog.map((tile, tileIndex) => {
    const tileId = anonymousId('fixture-tile', tileIndex);
    tileIdMap.set(tile.id, tileId);
    return {
      id: tileId,
      name: `Fixture tile ${tileIndex + 1}`,
      product_set: 'Anonymized fixture pack',
      dimensions: {
        ...tile.dimensions,
        grid_cells: tile.dimensions.grid_cells.map((cell) => ({ ...cell })),
      },
      faces: tile.faces.map((face, faceIndex) => {
        const faceId = anonymousId(`${tileId}-face`, faceIndex);
        faceIdMap.set(`${tile.id}:${face.face_id}`, faceId);
        return {
          face_id: faceId,
          face_name: `Fixture face ${faceIndex + 1}`,
          role_tags: [...face.role_tags],
          edge_sockets: face.edge_sockets.map((socket) => ({ ...socket, reason: 'anonymized fixture socket' })),
          rotation_rules: {
            allowed_rotations: [...face.rotation_rules.allowed_rotations],
            flip_allowed: face.rotation_rules.flip_allowed,
          },
          theme_tags: [],
        };
      }),
      catalog_status: tile.catalog_status,
      category: tile.category,
      tags: [],
      catalog_version: tile.catalog_version,
    } satisfies TileType;
  });

  return {
    issueKind: options.issueKind,
    anonymizedAt: generatedAt,
    solverVersion: options.solverVersion ?? SOLVER_VERSION,
    catalogVersion: resolveFixtureCatalogVersion(anonymizedCatalog),
    catalog: anonymizedCatalog,
    inventory: options.inventory
      .filter((item) => tileIdMap.has(item.tile_type_id))
      .map((item) => ({
        tile_type_id: tileIdMap.get(item.tile_type_id) ?? item.tile_type_id,
        owned_quantity: item.owned_quantity,
        condition: 'unknown' as const,
      })),
    solverInput: {
      bounds: { ...options.bounds },
      targetPlacements: options.targetPlacements,
      seed: options.seed ?? 'diagnostic-replay-seed',
      goal: `diagnostic-replay-${options.issueKind}`,
      createdAt: generatedAt,
    },
    expectedLayout: options.expectedLayout
      ? {
          placements: options.expectedLayout.placements.map((placement) => ({
            ...placement,
            tile_type_id: tileIdMap.get(placement.tile_type_id) ?? placement.tile_type_id,
            face_id: faceIdMap.get(`${placement.tile_type_id}:${placement.face_id}`) ?? placement.face_id,
            grid_cells: placement.grid_cells.map((cell) => ({ ...cell })),
          })),
          solver_version: options.expectedLayout.solver_version,
          catalog_version: options.expectedLayout.catalog_version,
          created_at: options.expectedLayout.created_at,
        }
      : undefined,
  };
}

export function buildLocalDiagnosticLog(options: {
  generatedAt?: string;
  appVersion?: string;
  appName?: string;
  solverRuns?: DiagnosticSolverRun[];
  navigation?: DiagnosticNavigationEvent[];
  errors?: DiagnosticErrorEvent[];
  anonymizedFixture?: DiagnosticAnonymizedLayoutFixture;
} = {}): LocalDiagnosticLog {
  const recentSolverRuns = (options.solverRuns ?? getDiagnosticSolverRuns()).slice(-DIAGNOSTIC_LIMITS.solverRuns);
  const catalogVersion = options.anonymizedFixture?.catalogVersion ?? getDiagnosticCatalogVersion(options.anonymizedFixture);
  const solverVersion = options.anonymizedFixture?.solverVersion ?? recentSolverRuns.at(-1)?.solverVersion ?? SOLVER_VERSION;

  return {
    schemaVersion: 2,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    collectionMode: 'local-only-opt-in',
    consent: {
      required: true,
      explanation:
        'Diagnostics are generated only when you tap Export diagnostics. The JSON stays on this device until you choose to share it.',
      collected: [
        'app version',
        'catalog version',
        'solver version',
        'solver timing and search counts',
        'last navigation routes',
        'last error messages and stack traces',
        'optional anonymized layout fixture data for support replay',
      ],
      excluded: [
        'inventory data',
        'layout data',
        'seed values',
        'raw inventory data',
        'raw layout data',
        'goal text',
        'user seed values',
        'device identifiers',
        'account identifiers',
        'network identifiers',
      ],
    },
    app: {
      name: options.appName ?? getExpoConfigValue('name') ?? 'TileKeeper',
      version: options.appVersion ?? getExpoConfigValue('version') ?? '0.0.0',
    },
    catalog: {
      version: catalogVersion,
    },
    solver: {
      version: solverVersion,
      runs: recentSolverRuns,
    },
    navigation: {
      events: (options.navigation ?? getDiagnosticNavigationEvents()).slice(-DIAGNOSTIC_LIMITS.navigationEvents),
    },
    errors: (options.errors ?? getDiagnosticErrors()).slice(-DIAGNOSTIC_LIMITS.errors),
    ...(options.anonymizedFixture ? { anonymizedFixture: options.anonymizedFixture } : {}),
  };
}

export async function writeLocalDiagnosticLogFile(log = buildLocalDiagnosticLog()): Promise<{ uri: string; fileName: string }> {
  const [{ File, Paths }] = await Promise.all([import('expo-file-system')]);
  const fileName = `tilekeeper-diagnostics-${safeTimestamp(log.generatedAt)}.json`;
  const file = new File(Paths.document, fileName);
  if (file.exists) {
    file.delete();
  }
  file.create({ overwrite: true });
  file.write(JSON.stringify(log, null, 2));
  return { uri: file.uri, fileName };
}

export function diagnosticsConsentCopy(): string {
  return [
    'Local diagnostics are opt-in. TileKeeper creates a JSON file on this device only when you tap Export diagnostics.',
    'Included: app version, solver version, catalog version, solver timing/search counts, recent navigation routes, recent error messages/stack traces, and optional anonymized layout fixture data for support replay.',
    'Never included: raw inventory, raw layouts, goal text, user seeds, device identifiers, account identifiers, or network identifiers.',
  ].join('\n\n');
}

function anonymousId(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, '0')}`;
}

function getDiagnosticCatalogVersion(fixture?: DiagnosticAnonymizedLayoutFixture): string {
  return fixture?.catalogVersion ?? 'unknown';
}

function resolveFixtureCatalogVersion(catalog: TileType[]): string {
  const versions = [...new Set(catalog.map((tile) => tile.catalog_version).filter(Boolean))];
  if (versions.length === 0) return 'unknown';
  if (versions.length === 1) return versions[0];
  return versions.sort().join('+');
}

function normalizeRoute(route: string): string {
  return route.trim() || '/';
}

function normalizeError(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: 'Unknown diagnostic error' };
}

function pushLimited<T>(target: T[], entry: T, limit: number): void {
  target.push(entry);
  if (target.length > limit) {
    target.splice(0, target.length - limit);
  }
}

function getExpoConfigValue(key: 'name' | 'version'): string | undefined {
  try {
    // Keep expo-constants out of Jest's CommonJS path; Expo ships it as ESM.
    const constantsModule = require('expo-constants') as {
      default?: { expoConfig?: Partial<Record<'name' | 'version', string>> };
      expoConfig?: Partial<Record<'name' | 'version', string>>;
    };
    return constantsModule.default?.expoConfig?.[key] ?? constantsModule.expoConfig?.[key];
  } catch {
    return undefined;
  }
}

function safeTimestamp(timestamp: string): string {
  return timestamp.replace(/[:.]/g, '-');
}
