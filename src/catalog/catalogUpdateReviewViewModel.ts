import type { InventoryItem, Layout, TileType } from '../shared/types';

export type CatalogUpdateChangeKind = 'added' | 'removed' | 'changed' | 'discontinued';
export type CatalogUpdateSeverity = 'info' | 'warning' | 'danger';
export type CatalogConflictAction = 'keep-custom' | 'overwrite-with-official' | 'rename-custom';

export interface CatalogImpactSummary {
  ownedQuantity: number;
  savedLayoutPlacements: number;
  message: string;
}

export interface CatalogUpdateReviewItem {
  tileId: string;
  title: string;
  description: string;
  badge: string;
  severity: CatalogUpdateSeverity;
  impact?: string;
}

export interface CatalogUpdateReviewSection {
  kind: CatalogUpdateChangeKind;
  title: string;
  items: CatalogUpdateReviewItem[];
}

export interface CatalogSchemaWarning {
  title: string;
  message: string;
}

export interface CatalogConflictChoice {
  action: CatalogConflictAction;
  label: string;
}

export interface CatalogConflictResolution {
  tileId: string;
  customName: string;
  officialName: string;
  message: string;
  choices: CatalogConflictChoice[];
  selectedAction: CatalogConflictAction;
}

export interface CatalogUpdateReviewOptions {
  currentTiles: TileType[];
  incomingTiles: TileType[];
  inventory?: InventoryItem[];
  savedLayouts?: Layout[];
  schemaVersion?: number;
  supportedSchemaVersion?: number;
  minimumAppVersion?: string;
  catalogVersion?: string;
}

export interface CatalogUpdateReviewViewModel {
  title: string;
  subtitle: string;
  catalogVersion?: string;
  summaryCounts: {
    added: number;
    removed: number;
    changed: number;
    discontinued: number;
    conflicts: number;
  };
  sections: CatalogUpdateReviewSection[];
  conflicts: CatalogConflictResolution[];
  schemaWarning?: CatalogSchemaWarning;
  canAcceptUpdate: boolean;
  primaryActionLabel: 'Accept update' | 'Defer update';
  secondaryActionLabel: 'Keep using current catalog';
  emptyMessage?: string;
}

const CONFLICT_CHOICES: CatalogConflictChoice[] = [
  { action: 'keep-custom', label: 'Keep custom tile' },
  { action: 'overwrite-with-official', label: 'Overwrite with official tile' },
  { action: 'rename-custom', label: 'Rename custom tile' },
];

function byId(tiles: TileType[]): Map<string, TileType> {
  return new Map(tiles.map((tile) => [tile.id, tile]));
}

function tileChanged(current: TileType, incoming: TileType): boolean {
  return JSON.stringify(current) !== JSON.stringify(incoming);
}

function countLayoutPlacements(savedLayouts: Layout[], tileId: string): number {
  return savedLayouts.reduce((count, layout) => count + layout.placements.filter((placement) => placement.tile_type_id === tileId).length, 0);
}

function buildImpact(tileId: string, inventory: InventoryItem[], savedLayouts: Layout[]): CatalogImpactSummary | undefined {
  const ownedQuantity = inventory
    .filter((item) => item.tile_type_id === tileId)
    .reduce((sum, item) => sum + item.owned_quantity, 0);
  const savedLayoutPlacements = countLayoutPlacements(savedLayouts, tileId);

  if (ownedQuantity === 0 && savedLayoutPlacements === 0) {
    return undefined;
  }

  const ownedCopy = ownedQuantity === 1 ? '1 copy' : `${ownedQuantity} and`;
  const layoutCopy = savedLayoutPlacements === 1 ? '1 saved layout placement' : `${savedLayoutPlacements} saved layout placements`;
  let usage = '';
  if (ownedQuantity > 0 && savedLayoutPlacements > 0) {
    usage = `You own ${ownedCopy} have ${layoutCopy} using this tile.`;
  } else if (ownedQuantity > 0) {
    usage = `You own ${ownedQuantity === 1 ? '1 copy' : `${ownedQuantity} copies`} of this tile.`;
  } else {
    usage = `You have ${layoutCopy} using this tile.`;
  }

  return {
    ownedQuantity,
    savedLayoutPlacements,
    message: `${usage} Existing inventory and layouts stay available with a warning badge.`,
  };
}

function addSection(sections: CatalogUpdateReviewSection[], kind: CatalogUpdateChangeKind, title: string, items: CatalogUpdateReviewItem[]): void {
  if (items.length > 0) {
    sections.push({ kind, title, items });
  }
}

function schemaWarningFor(options: CatalogUpdateReviewOptions): CatalogSchemaWarning | undefined {
  const schemaVersion = options.schemaVersion ?? options.supportedSchemaVersion ?? 1;
  const supportedSchemaVersion = options.supportedSchemaVersion ?? 1;
  if (schemaVersion <= supportedSchemaVersion) {
    return undefined;
  }

  const requiredVersion = options.minimumAppVersion ?? 'a newer version';
  return {
    title: 'App update required',
    message: `This pack requires TileKeeper v${requiredVersion} or later. Your current app supports catalog schema v${supportedSchemaVersion}, but the pack uses v${schemaVersion}.`,
  };
}

function conflictFor(customTile: TileType, officialTile: TileType): CatalogConflictResolution {
  return {
    tileId: customTile.id,
    customName: customTile.name,
    officialName: officialTile.name,
    message: `Custom tile “${customTile.name}” uses official ID ${customTile.id}. Choose whether to keep it, overwrite it, or rename the custom tile before accepting.`,
    choices: CONFLICT_CHOICES,
    selectedAction: 'keep-custom',
  };
}

export function applyCatalogConflictResolution(
  conflict: CatalogConflictResolution,
  selectedAction: CatalogConflictAction,
): CatalogConflictResolution {
  return { ...conflict, selectedAction };
}

export function buildCatalogUpdateReviewViewModel(options: CatalogUpdateReviewOptions): CatalogUpdateReviewViewModel {
  const currentById = byId(options.currentTiles);
  const incomingById = byId(options.incomingTiles);
  const inventory = options.inventory ?? [];
  const savedLayouts = options.savedLayouts ?? [];
  const schemaWarning = schemaWarningFor(options);

  const added = options.incomingTiles
    .filter((tile) => !currentById.has(tile.id))
    .map<CatalogUpdateReviewItem>((tile) => ({
      tileId: tile.id,
      title: tile.name,
      description: `${tile.name} was added to the ${tile.category} catalogue from ${tile.catalog_version}.`,
      badge: 'New',
      severity: 'info',
    }));

  const removed = options.currentTiles
    .filter((tile) => !incomingById.has(tile.id) && tile.catalog_status !== 'custom')
    .map<CatalogUpdateReviewItem>((tile) => {
      const impact = buildImpact(tile.id, inventory, savedLayouts);
      return {
        tileId: tile.id,
        title: tile.name,
        description: `${tile.name} is not included in this catalog update.`,
        badge: 'Removed',
        severity: impact ? 'warning' : 'info',
        impact: impact?.message,
      };
    });

  const changed = options.incomingTiles
    .filter((tile) => {
      const current = currentById.get(tile.id);
      return Boolean(current && current.catalog_status !== 'custom' && tile.catalog_status !== 'deprecated' && tileChanged(current, tile));
    })
    .map<CatalogUpdateReviewItem>((tile) => ({
      tileId: tile.id,
      title: tile.name,
      description: tile.notes ? `${tile.name}: ${tile.notes}.` : `${tile.name} has updated catalog metadata.`,
      badge: 'Changed',
      severity: 'info',
    }));

  const discontinued = options.incomingTiles
    .filter((tile) => tile.catalog_status === 'deprecated')
    .map<CatalogUpdateReviewItem>((tile) => {
      const impact = buildImpact(tile.id, inventory, savedLayouts);
      return {
        tileId: tile.id,
        title: tile.name,
        description: tile.notes ? `${tile.name}: ${tile.notes}.` : `${tile.name} has been marked discontinued by the catalog.`,
        badge: 'Discontinued',
        severity: 'warning',
        impact: impact?.message,
      };
    });

  const conflicts = options.currentTiles
    .filter((current) => current.catalog_status === 'custom')
    .flatMap((customTile) => {
      const incoming = incomingById.get(customTile.id);
      return incoming && incoming.catalog_status === 'official' ? [conflictFor(customTile, incoming)] : [];
    });

  const sections: CatalogUpdateReviewSection[] = [];
  addSection(sections, 'added', 'New tiles', added);
  addSection(sections, 'removed', 'Removed from update', removed);
  addSection(sections, 'changed', 'Metadata changed', changed);
  addSection(sections, 'discontinued', 'Discontinued tiles', discontinued);

  const totalChanges = added.length + removed.length + changed.length + discontinued.length + conflicts.length;
  const canAcceptUpdate = !schemaWarning;

  return {
    title: 'Catalog update review',
    subtitle: totalChanges === 0 ? 'No catalog changes need review.' : 'Review what changed before updating your local catalog.',
    catalogVersion: options.catalogVersion,
    summaryCounts: {
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      discontinued: discontinued.length,
      conflicts: conflicts.length,
    },
    sections,
    conflicts,
    schemaWarning,
    canAcceptUpdate,
    primaryActionLabel: canAcceptUpdate ? 'Accept update' : 'Defer update',
    secondaryActionLabel: 'Keep using current catalog',
    emptyMessage: totalChanges === 0 ? 'No conflicts, discontinued tiles, or metadata changes were found.' : undefined,
  };
}
