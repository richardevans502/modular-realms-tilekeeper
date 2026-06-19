import type { InventoryItem, TileCategory, TileType } from '../shared/types';

export type MissingTileReason =
  | 'required-tile-type-shortage'
  | 'required-category-shortage'
  | 'no-catalog-candidate';

export interface RequiredCategory {
  category: TileCategory;
  quantity: number;
}

export interface MissingTileSuggestion {
  tile_type_id: string | null;
  name: string;
  category: TileCategory;
  missing_quantity: number;
  reason: MissingTileReason;
  matched_theme_tags: string[];
  score: number;
}

export interface SuggestMissingTilesInput {
  catalog: TileType[];
  inventory: InventoryItem[];
  requiredTileTypeIds?: string[];
  requiredCategories?: RequiredCategory[];
  themeTags?: string[];
}

interface Candidate {
  tile: TileType;
  matchedThemeTags: string[];
  score: number;
}

export function suggestMissingTiles(input: SuggestMissingTilesInput): MissingTileSuggestion[] {
  const requiredTileTypeSuggestions = buildRequiredTileTypeSuggestions(input);
  const categorySuggestions = buildCategorySuggestions(input);

  return [...requiredTileTypeSuggestions, ...categorySuggestions];
}

function buildRequiredTileTypeSuggestions({
  catalog,
  inventory,
  requiredTileTypeIds = [],
}: SuggestMissingTilesInput): MissingTileSuggestion[] {
  if (requiredTileTypeIds.length === 0) {
    return [];
  }

  const catalogById = new Map(catalog.map((tile) => [tile.id, tile]));
  const ownedByTileType = buildAvailableInventoryMap(inventory);
  const requiredByTileType = countBy(requiredTileTypeIds);
  const suggestions: MissingTileSuggestion[] = [];

  for (const [tileTypeId, requiredQuantity] of requiredByTileType.entries()) {
    const missingQuantity = requiredQuantity - (ownedByTileType.get(tileTypeId) ?? 0);
    if (missingQuantity <= 0) {
      continue;
    }

    const tile = catalogById.get(tileTypeId);
    suggestions.push({
      tile_type_id: tileTypeId,
      name: tile?.name ?? `Missing ${tileTypeId} tile`,
      category: tile?.category ?? 'custom',
      missing_quantity: missingQuantity,
      reason: 'required-tile-type-shortage',
      matched_theme_tags: [],
      score: 2000,
    });
  }

  return suggestions.sort(compareSuggestions);
}

function buildCategorySuggestions({
  catalog,
  inventory,
  requiredCategories = [],
  themeTags = [],
}: SuggestMissingTilesInput): MissingTileSuggestion[] {
  if (requiredCategories.length === 0) {
    return [];
  }

  const availableByCategory = new Map<TileCategory, number>();
  const catalogById = new Map(catalog.map((tile) => [tile.id, tile]));

  for (const item of inventory) {
    const tile = catalogById.get(item.tile_type_id);
    if (!tile) {
      continue;
    }
    availableByCategory.set(
      tile.category,
      (availableByCategory.get(tile.category) ?? 0) + availableQuantity(item),
    );
  }

  const suggestions: MissingTileSuggestion[] = [];

  for (const requirement of requiredCategories) {
    const missingQuantity = requirement.quantity - (availableByCategory.get(requirement.category) ?? 0);
    if (missingQuantity <= 0) {
      continue;
    }

    const candidate = chooseBestCandidate(catalog, requirement.category, themeTags);
    if (!candidate) {
      suggestions.push({
        tile_type_id: null,
        name: `Missing ${requirement.category} tile`,
        category: requirement.category,
        missing_quantity: missingQuantity,
        reason: 'no-catalog-candidate',
        matched_theme_tags: [],
        score: 0,
      });
      continue;
    }

    suggestions.push({
      tile_type_id: candidate.tile.id,
      name: candidate.tile.name,
      category: candidate.tile.category,
      missing_quantity: missingQuantity,
      reason: 'required-category-shortage',
      matched_theme_tags: candidate.matchedThemeTags,
      score: candidate.score,
    });
  }

  return suggestions.sort(compareSuggestions);
}

function chooseBestCandidate(
  catalog: TileType[],
  category: TileCategory,
  themeTags: string[],
): Candidate | null {
  const desiredThemeTags = new Set(themeTags);
  const candidates = catalog
    .filter((tile) => tile.category === category)
    .map((tile) => {
      const matchedThemeTags = [...collectThemeTags(tile)].filter((tag) => desiredThemeTags.has(tag)).sort();
      return {
        tile,
        matchedThemeTags,
        score: 1000 + matchedThemeTags.length * 200 + catalogStatusBonus(tile),
      };
    })
    .sort(compareCandidates);

  return candidates[0] ?? null;
}

function collectThemeTags(tile: TileType): Set<string> {
  const tags = new Set<string>();
  for (const face of tile.faces) {
    for (const tag of face.theme_tags) {
      tags.add(tag);
    }
  }
  return tags;
}

function catalogStatusBonus(tile: TileType): number {
  return tile.catalog_status === 'official' ? 1 : 0;
}

function buildAvailableInventoryMap(inventory: InventoryItem[]): Map<string, number> {
  const availableByTileType = new Map<string, number>();
  for (const item of inventory) {
    availableByTileType.set(
      item.tile_type_id,
      (availableByTileType.get(item.tile_type_id) ?? 0) + availableQuantity(item),
    );
  }
  return availableByTileType;
}

function availableQuantity(item: InventoryItem): number {
  return item.owned_quantity;
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function compareCandidates(left: Candidate, right: Candidate): number {
  return right.score - left.score || left.tile.name.localeCompare(right.tile.name) || left.tile.id.localeCompare(right.tile.id);
}

function compareSuggestions(left: MissingTileSuggestion, right: MissingTileSuggestion): number {
  return right.score - left.score || left.name.localeCompare(right.name) || (left.tile_type_id ?? '').localeCompare(right.tile_type_id ?? '');
}
