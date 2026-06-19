import type { InventoryCondition, TileType } from '../shared/types';
import type { InventoryDetail } from '../db/inventoryRepository';

export type InventoryConditionFilter = InventoryCondition | 'all';

export interface InventoryRow {
  id: string;
  title: string;
  subtitle: string;
  owned_quantity: number;
  condition: InventoryCondition;
  notes?: string;
  storage_location?: string;
}

export interface InventoryFilterState {
  searchText: string;
  condition: InventoryConditionFilter;
}

function joinSubtitle(parts: Array<string | undefined>): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(' · ');
}

export function toInventoryRows(details: InventoryDetail[]): InventoryRow[] {
  return details.map((detail) => {
    const { item, tile } = detail;
    const title = tile?.name ?? item.tile_type_id;
    const subtitle = tile
      ? joinSubtitle([tile.product_set, tile.category, item.storage_location])
      : joinSubtitle(['Unmatched catalog tile', item.storage_location]);

    return {
      id: item.tile_type_id,
      title,
      subtitle,
      owned_quantity: item.owned_quantity,
      condition: item.condition,
      notes: item.notes,
      storage_location: item.storage_location,
    };
  });
}

export function filterInventoryRows(rows: InventoryRow[], filters: InventoryFilterState): InventoryRow[] {
  const normalizedSearch = filters.searchText.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesCondition = filters.condition === 'all' || row.condition === filters.condition;
    if (!matchesCondition) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [row.id, row.title, row.subtitle, row.condition, row.notes, row.storage_location]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

export function mergeCatalogWithInventory(catalog: TileType[], inventoryDetails: InventoryDetail[]): InventoryDetail[] {
  const detailsMap = new Map(inventoryDetails.map((detail) => [detail.item.tile_type_id, detail]));
  return catalog.map((tile) => {
    const detail = detailsMap.get(tile.id);
    if (detail) return detail;
    return {
      item: {
        tile_type_id: tile.id,
        owned_quantity: 0,
        condition: 'unknown',
      },
      tile,
    };
  });
}
