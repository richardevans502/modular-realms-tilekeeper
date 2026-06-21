import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TileType, InventoryItem } from '../shared/types';
import type { InventoryRepository, InventoryDetail } from '../db/inventoryRepository';
import type { CatalogRepository } from '../db/catalogRepository';
import { EmptyState } from '../ui/EmptyState';
import { ShimmerPlaceholder } from '../ui/ShimmerPlaceholder';
import { tileKeeperTheme } from '../ui/theme';
import {
  filterInventoryRows,
  mergeCatalogWithInventory,
  toInventoryRows,
  type InventoryFilterState,
  type InventoryRow,
} from './inventoryViewModel';

export interface InventoryScreenProps {
  catalog: TileType[];
  inventoryRepository: InventoryRepository;
  catalogRepository: CatalogRepository;
}

export function InventoryScreen({ catalog, inventoryRepository, catalogRepository }: InventoryScreenProps) {
  const [filters, setFilters] = useState<InventoryFilterState>({ searchText: '', condition: 'all' });
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState<InventoryDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedTileId, setExpandedTileId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [editStorage, setEditStorage] = useState<Record<string, string>>({});

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const inventoryDetails = await inventoryRepository.listInventoryDetails();
      const merged = mergeCatalogWithInventory(catalog, inventoryDetails);
      setDetails(merged);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load inventory.');
    } finally {
      setIsLoading(false);
    }
  }, [catalog, inventoryRepository]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const rows = useMemo(() => {
    const allRows = toInventoryRows(details);
    return filterInventoryRows(allRows, filters);
  }, [details, filters]);

  const conditionFilterOptions: InventoryFilterState['condition'][] = ['all', 'new', 'good', 'worn', 'damaged', 'unknown'];

  const stats = useMemo(() => {
    const allRows = toInventoryRows(details);
    const owned = allRows.reduce((sum, row) => sum + row.owned_quantity, 0);
    const cataloged = allRows.filter((row) => row.owned_quantity > 0).length;
    return { totalOwned: owned, catalogedCount: cataloged, totalCatalog: catalog.length };
  }, [details, catalog.length]);

  async function upsertItem(row: InventoryRow, patch: Partial<InventoryItem>) {
    try {
      const nextItem: InventoryItem = {
        tile_type_id: row.id,
        owned_quantity: patch.owned_quantity ?? row.owned_quantity,
        condition: patch.condition ?? row.condition,
        notes: patch.notes ?? row.notes,
        storage_location: patch.storage_location ?? row.storage_location,
      };
      await inventoryRepository.upsertInventoryItem(nextItem);
      await loadInventory();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Update failed.');
    }
  }

  function adjustOwned(row: InventoryRow, delta: number) {
    const next = Math.max(0, row.owned_quantity + delta);
    void upsertItem(row, { owned_quantity: next });
  }

  function cycleCondition(row: InventoryRow) {
    const conditions: InventoryItem['condition'][] = ['new', 'good', 'worn', 'damaged', 'unknown'];
    const currentIndex = conditions.indexOf(row.condition);
    const next = conditions[(currentIndex + 1) % conditions.length];
    void upsertItem(row, { condition: next });
  }

  function saveExpanded(row: InventoryRow) {
    void upsertItem(row, {
      notes: editNotes[row.id] ?? row.notes,
      storage_location: editStorage[row.id] ?? row.storage_location,
    });
    setExpandedTileId(null);
  }

  function setQuantityDirectly(row: InventoryRow, value: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const next = Math.floor(parsed);
    void upsertItem(row, { owned_quantity: next });
  }

  const renderTileCard = ({ item: row }: { item: InventoryRow }) => {
    const isExpanded = expandedTileId === row.id;
    return (
      <View style={styles.tileCard}>
        <TouchableOpacity
          accessibilityLabel={`${row.title} inventory card`}
          accessibilityRole="button"
          onPress={() => setExpandedTileId(isExpanded ? null : row.id)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.tileTitle}>{row.title}</Text>
              <Text style={styles.tileSubtitle}>{row.subtitle}</Text>
            </View>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{row.condition}</Text>
            </View>
          </View>

          <View style={styles.quantityRow}>
            <View style={styles.quantityBlock}>
              <Text style={styles.quantityLabel}>Owned</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  accessibilityLabel={`Decrease owned quantity for ${row.title}`}
                  accessibilityRole="button"
                  onPress={() => adjustOwned(row, -1)}
                  style={styles.miniStepper}
                >
                  <Text style={styles.miniStepperText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  accessibilityLabel={`Owned quantity for ${row.title}`}
                  keyboardType="number-pad"
                  onChangeText={(value) => setQuantityDirectly(row, value)}
                  style={styles.quantityInput}
                  value={String(row.owned_quantity)}
                />
                <TouchableOpacity
                  accessibilityLabel={`Increase owned quantity for ${row.title}`}
                  accessibilityRole="button"
                  onPress={() => adjustOwned(row, 1)}
                  style={styles.miniStepper}
                >
                  <Text style={styles.miniStepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {row.notes ? <Text style={styles.notesPreview}>{row.notes}</Text> : null}
        </TouchableOpacity>

        {isExpanded ? (
          <View style={styles.expandedPanel}>
            <Text style={styles.panelLabel}>Condition</Text>
            <TouchableOpacity
              accessibilityLabel={`Cycle condition for ${row.title}`}
              accessibilityRole="button"
              onPress={() => cycleCondition(row)}
              style={styles.conditionCycleButton}
            >
              <Text style={styles.conditionCycleText}>{row.condition} → next</Text>
            </TouchableOpacity>

            <Text style={styles.panelLabel}>Storage location</Text>
            <TextInput
              accessibilityLabel={`Storage location for ${row.title}`}
              placeholder="e.g. Core box, Drawer A"
              placeholderTextColor={tileKeeperTheme.colours.mutedText}
              style={styles.panelInput}
              value={editStorage[row.id] ?? row.storage_location ?? ''}
              onChangeText={(value) => setEditStorage((current) => ({ ...current, [row.id]: value }))}
            />

            <Text style={styles.panelLabel}>Notes</Text>
            <TextInput
              accessibilityLabel={`Notes for ${row.title}`}
              multiline
              placeholder="Add notes about this tile..."
              placeholderTextColor={tileKeeperTheme.colours.mutedText}
              style={[styles.panelInput, styles.notesInput]}
              value={editNotes[row.id] ?? row.notes ?? ''}
              onChangeText={(value) => setEditNotes((current) => ({ ...current, [row.id]: value }))}
            />

            <View style={styles.panelActions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setExpandedTileId(null)}
                style={styles.panelSecondaryButton}
              >
                <Text style={styles.panelSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => saveExpanded(row)}
                style={styles.panelPrimaryButton}
              >
                <Text style={styles.panelPrimaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
      style={styles.screen}
    >
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Inventory</Text>
        <Text style={styles.title} allowFontScaling>Your tile collection</Text>
        <Text style={styles.subtitle} allowFontScaling>Track owned quantities, condition, and storage for every catalog tile.</Text>
        <View style={styles.statsRow}>
          <StatPill label="Owned" value={stats.totalOwned} />
          <StatPill label="Catalog size" value={`${stats.catalogedCount}/${stats.totalCatalog}`} />
        </View>
      </View>

      <View style={styles.searchCard}>
        <TextInput
          accessibilityLabel="Search inventory"
          accessibilityRole="search"
          placeholder="Search by name, set, category, notes, location..."
          placeholderTextColor={tileKeeperTheme.colours.mutedText}
          value={filters.searchText}
          onChangeText={(searchText) => setFilters((current) => ({ ...current, searchText }))}
          style={styles.searchInput}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {conditionFilterOptions.map((condition) => (
            <TouchableOpacity
              key={condition}
              accessibilityRole="button"
              accessibilityLabel={condition === 'all' ? 'All conditions' : condition}
              accessibilityState={{ selected: filters.condition === condition }}
              onPress={() => setFilters((current) => ({ ...current, condition }))}
              style={[styles.filterChip, filters.condition === condition && styles.filterChipSelected]}
            >
              <Text style={[styles.filterChipText, filters.condition === condition && styles.filterChipTextSelected]} allowFontScaling>
                {condition === 'all' ? 'All conditions' : condition}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={rows}
        keyExtractor={(row) => row.id}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.shimmerStack} accessibilityLabel="Loading inventory" accessibilityRole="progressbar" accessibilityState={{ busy: true }}>
              <ShimmerPlaceholder height={72} />
              <ShimmerPlaceholder height={72} />
              <ShimmerPlaceholder height={72} />
            </View>
          ) : (
            <EmptyState
              icon="📦"
              title="No tiles match your filters"
              message="Try clearing filters or search terms. All catalog tiles are shown even if you own zero copies."
            />
          )
        }
        renderItem={renderTileCard}
      />
    </KeyboardAvoidingView>
  );
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue} allowFontScaling>{value}</Text>
      <Text style={styles.statLabel} allowFontScaling>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tileKeeperTheme.colours.background,
    padding: tileKeeperTheme.spacing.lg,
    gap: tileKeeperTheme.spacing.md,
  },
  heroCard: {
    backgroundColor: tileKeeperTheme.colours.frame,
    borderColor: tileKeeperTheme.colours.secondaryBright,
    borderRadius: tileKeeperTheme.radius.sheet,
    borderWidth: 2,
    padding: tileKeeperTheme.spacing.xl,
  },
  eyebrow: {
    color: tileKeeperTheme.colours.secondaryBright,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: tileKeeperTheme.colours.onFrame,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: tileKeeperTheme.colours.raisedSurface,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  statPill: {
    backgroundColor: '#2A2118',
    borderColor: tileKeeperTheme.colours.secondary,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statValue: {
    color: tileKeeperTheme.colours.secondaryBright,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: tileKeeperTheme.colours.raisedSurface,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  searchCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.sheet,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.input,
    borderWidth: 1,
    color: tileKeeperTheme.colours.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChipsRow: {
    gap: 8,
    paddingRight: 10,
  },
  filterChip: {
    borderColor: tileKeeperTheme.colours.primary,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipSelected: {
    backgroundColor: tileKeeperTheme.colours.primary,
    borderColor: tileKeeperTheme.colours.primary,
  },
  filterChipText: {
    color: tileKeeperTheme.colours.primary,
    fontWeight: '800',
  },
  filterChipTextSelected: {
    color: tileKeeperTheme.colours.onFrame,
  },
  errorText: {
    color: tileKeeperTheme.colours.danger,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  tileCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.sheet,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  tileTitle: {
    color: tileKeeperTheme.colours.text,
    fontSize: 20,
    fontWeight: '900',
  },
  tileSubtitle: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  conditionBadge: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  conditionText: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  quantityBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  quantityLabel: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStepper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tileKeeperTheme.colours.frame,
    borderColor: tileKeeperTheme.colours.secondary,
    borderRadius: tileKeeperTheme.radius.button,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 36,
  },
  miniStepperText: {
    color: tileKeeperTheme.colours.secondaryBright,
    fontSize: 20,
    fontWeight: '900',
  },
  quantityInput: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.input,
    borderWidth: 1,
    color: tileKeeperTheme.colours.text,
    fontSize: 16,
    fontWeight: '900',
    minHeight: 36,
    minWidth: 48,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  quantityReadout: {
    color: tileKeeperTheme.colours.text,
    fontSize: 18,
    fontWeight: '900',
    minHeight: 36,
    minWidth: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  notesPreview: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
  expandedPanel: {
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tileKeeperTheme.colours.border,
  },
  panelLabel: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  conditionCycleButton: {
    alignSelf: 'flex-start',
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.button,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  conditionCycleText: {
    color: tileKeeperTheme.colours.primary,
    fontWeight: '800',
  },
  panelInput: {
    backgroundColor: '#FFFFFF',
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.input,
    borderWidth: 1,
    color: tileKeeperTheme.colours.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  panelActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  panelSecondaryButton: {
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.button,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  panelSecondaryButtonText: {
    color: tileKeeperTheme.colours.focus,
    fontWeight: '800',
  },
  panelPrimaryButton: {
    backgroundColor: tileKeeperTheme.colours.primary,
    borderColor: tileKeeperTheme.colours.secondaryBright,
    borderRadius: tileKeeperTheme.radius.button,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  panelPrimaryButtonText: {
    color: tileKeeperTheme.colours.onFrame,
    fontWeight: '800',
  },
  shimmerStack: {
    gap: 12,
    paddingBottom: 32,
  },
});
