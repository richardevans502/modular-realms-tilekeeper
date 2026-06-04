import type { InventoryCondition } from '../shared/types';
import type { InventoryDetail } from '../db/inventoryRepository';

export type InventoryConditionFilter = InventoryCondition | 'all';

export interface InventoryRow {
  id: string;
  title: string;
  subtitle: string;
  owned_quantity: number;
  reserved: number;
  available_quantity: number;
  condition: InventoryCondition;
  notes?: string;
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
    const { item, tile, available_quantity } = detail;
    const title = tile?.name ?? item.tile_type_id;
    const subtitle = tile
      ? joinSubtitle([tile.product_set, tile.category, item.storage_location])
      : joinSubtitle(['Unmatched catalog tile', item.storage_location]);

    return {
      id: item.tile_type_id,
      title,
      subtitle,
      owned_quantity: item.owned_quantity,
      reserved: item.reserved,
      available_quantity,
      condition: item.condition,
      notes: item.notes,
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

    return [row.id, row.title, row.subtitle, row.condition, row.notes]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });
}
