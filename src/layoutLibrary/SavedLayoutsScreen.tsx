import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SavedLayout, SavedLayoutRepository } from '../db/savedLayoutRepository';
import { EmptyState } from '../ui/EmptyState';
import { ShimmerPlaceholder } from '../ui/ShimmerPlaceholder';
import { tileKeeperTheme } from '../ui/theme';
import {
  buildSavedLayoutsViewModel,
  toSavedLayoutLibraryItem,
  type SavedLayoutLibraryItem,
  type SavedLayoutRow,
  type SavedLayoutsFilterState,
} from './savedLayoutsViewModel';

export interface SavedLayoutsScreenProps {
  layouts?: SavedLayoutLibraryItem[];
  repository?: Pick<SavedLayoutRepository, 'listLayouts' | 'deleteLayout' | 'updateLayout'>;
  onPreviewLayout?: (layoutId: string) => void;
  /** Increment to force a reload from the repository when the screen is already mounted. */
  reloadTrigger?: number;
}

export function SavedLayoutsScreen({ layouts = [], repository, onPreviewLayout, reloadTrigger }: SavedLayoutsScreenProps) {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<SavedLayoutsFilterState>({
    searchText: '',
    selectedTags: [],
    favouritesOnly: false,
  });
  const [repositoryLayouts, setRepositoryLayouts] = useState<SavedLayout[] | null>(repository ? [] : null);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(() => new Set(layouts.filter((layout) => layout.favourite).map((layout) => layout.id)));
  const [isLoading, setIsLoading] = useState(Boolean(repository));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLayouts = useCallback(async () => {
    if (!repository) {
      setRepositoryLayouts(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      setRepositoryLayouts(await repository.listLayouts());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load saved layouts.');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void loadLayouts();
  }, [loadLayouts, reloadTrigger]);

  const libraryLayouts = useMemo(() => {
    if (repositoryLayouts) {
      return repositoryLayouts.map((layout) => toSavedLayoutLibraryItem(layout));
    }
    return layouts.map((layout) => ({ ...layout, favourite: favouriteIds.has(layout.id) }));
  }, [favouriteIds, layouts, repositoryLayouts]);

  const viewModel = useMemo(() => buildSavedLayoutsViewModel(libraryLayouts, filters), [libraryLayouts, filters]);

  const toggleTag = (tag: string) => {
    setFilters((current) => ({
      ...current,
      selectedTags: current.selectedTags.includes(tag)
        ? current.selectedTags.filter((selectedTag) => selectedTag !== tag)
        : [...current.selectedTags, tag],
    }));
  };

  const toggleFavourite = async (layout: SavedLayoutRow) => {
    if (repository) {
      try {
        await repository.updateLayout(layout.id, { favourite: !layout.isFavourite, updated_at: new Date().toISOString() });
        await loadLayouts();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : `Could not update ${layout.title}.`);
      }
      return;
    }

    setFavouriteIds((current) => {
      const next = new Set(current);
      if (next.has(layout.id)) {
        next.delete(layout.id);
      } else {
        next.add(layout.id);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({ searchText: '', selectedTags: [], favouritesOnly: false });
  };

  const deleteLayout = async (layout: SavedLayoutRow) => {
    try {
      if (repository) {
        await repository.deleteLayout(layout.id);
        await loadLayouts();
      } else {
        setRepositoryLayouts((current) => current?.filter((item) => item.id !== layout.id) ?? null);
      }
      setFavouriteIds((current) => {
        const next = new Set(current);
        next.delete(layout.id);
        return next;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `Could not delete ${layout.title}.`);
    }
  };

  const requestDeleteLayout = (layout: SavedLayoutRow) => {
    Alert.alert('Delete saved layout?', `Remove “${layout.title}” from the library. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteLayout(layout) },
    ]);
  };

  const renderLayoutCard = ({ item: layout }: { item: SavedLayoutRow }) => (
    <TouchableOpacity
      accessibilityLabel={`Open saved layout ${layout.title}`}
      accessibilityRole="button"
      key={layout.id}
      onLongPress={() => requestDeleteLayout(layout)}
      onPress={() => onPreviewLayout?.(layout.id)}
      style={styles.layoutCard}
    >
      <View style={styles.cardBodyRow}>
        <LayoutThumbnail cells={layout.thumbnailCells ?? []} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.layoutTitle}>{layout.title}</Text>
              <Text style={styles.layoutSubtitle}>{layout.subtitle}</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={layout.isFavourite ? `Remove ${layout.title} from favourites` : `Add ${layout.title} to favourites`}
              accessibilityRole="button"
              onPress={() => void toggleFavourite(layout)}
              style={styles.favouriteButton}
            >
              <Text style={styles.favouriteIcon}>{layout.isFavourite ? '★' : '☆'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.goalText}>{layout.goal}</Text>
          {layout.notes ? <Text style={styles.notesText}>{layout.notes}</Text> : null}
          <View style={styles.cardTagsRow}>
            {layout.tagLabels.map((tag) => (
              <Text key={`${layout.id}-${tag}`} style={styles.cardTag}>
                #{tag}
              </Text>
            ))}
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={() => requestDeleteLayout(layout)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Library</Text>
        <Text style={styles.title} allowFontScaling>Saved layouts</Text>
        <Text style={styles.subtitle} allowFontScaling>Find favourites, campaign maps, and quick rebuild plans before the tabletop goblins scatter your tiles.</Text>
        <View style={styles.statsRow}>
          <StatPill label="Saved" value={viewModel.totalCount} />
          <StatPill label="Favourites" value={viewModel.favouriteCount} />
          <StatPill label="Showing" value={viewModel.filteredCount} />
        </View>
      </View>

      <View style={styles.searchCard}>
        <TextInput
          accessibilityLabel="Search saved layouts"
          accessibilityRole="search"
          placeholder="Search by name"
          placeholderTextColor={tileKeeperTheme.colours.mutedText}
          value={filters.searchText}
          onChangeText={(searchText) => setFilters((current) => ({ ...current, searchText }))}
          style={styles.searchInput}
        />
        <View style={styles.filterRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: filters.favouritesOnly }}
            onPress={() => setFilters((current) => ({ ...current, favouritesOnly: !current.favouritesOnly }))}
            style={[styles.filterButton, filters.favouritesOnly && styles.filterButtonSelected]}
          >
            <Text style={[styles.filterButtonText, filters.favouritesOnly && styles.filterButtonTextSelected]}>★ Favourites</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
          {viewModel.availableTags.map((tag) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: tag.selected }}
              key={tag.label}
              onPress={() => toggleTag(tag.label)}
              style={[styles.tagChip, tag.selected && styles.tagChipSelected]}
            >
              <Text style={[styles.tagChipText, tag.selected && styles.tagChipTextSelected]}>{tag.label}</Text>
              <Text style={[styles.tagCount, tag.selected && styles.tagChipTextSelected]}>{tag.count}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={viewModel.rows}
        keyExtractor={(layout) => layout.id}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.shimmerStack} accessibilityLabel="Loading saved layouts" accessibilityRole="progressbar" accessibilityState={{ busy: true }}>
              <ShimmerPlaceholder height={96} />
              <ShimmerPlaceholder height={96} />
            </View>
          ) : (
            <EmptyState
              icon="📜"
              title={viewModel.emptyState?.title ?? 'No saved layouts yet'}
              message={viewModel.emptyState?.message ?? 'Save a generated layout and it will appear here.'}
            />
          )
        }
        renderItem={renderLayoutCard}
      />
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue} allowFontScaling>{value}</Text>
      <Text style={styles.statLabel} allowFontScaling>{label}</Text>
    </View>
  );
}

function LayoutThumbnail({ cells }: { cells: { x: number; y: number }[] }) {
  const visibleCells = cells.slice(0, 9);
  return (
    <View accessibilityLabel="Layout thumbnail" style={styles.thumbnail}>
      {Array.from({ length: 9 }, (_, index) => {
        const x = index % 3;
        const y = Math.floor(index / 3);
        const filled = visibleCells.some((cell) => Math.abs(cell.x % 3) === x && Math.abs(cell.y % 3) === y);
        return <View key={`${x}-${y}`} style={[styles.thumbnailCell, filled && styles.thumbnailCellFilled]} />;
      })}
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
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    borderColor: tileKeeperTheme.colours.primary,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterButtonSelected: {
    backgroundColor: tileKeeperTheme.colours.primary,
    borderColor: tileKeeperTheme.colours.primary,
  },
  filterButtonText: {
    color: tileKeeperTheme.colours.primary,
    fontWeight: '800',
  },
  filterButtonTextSelected: {
    color: tileKeeperTheme.colours.onFrame,
  },
  clearButton: {
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  clearButtonText: {
    color: tileKeeperTheme.colours.focus,
    fontWeight: '800',
  },
  tagsRow: {
    gap: 8,
    paddingRight: 10,
  },
  tagChip: {
    alignItems: 'center',
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipSelected: {
    backgroundColor: tileKeeperTheme.colours.secondaryBright,
    borderColor: tileKeeperTheme.colours.secondaryBright,
  },
  tagChipText: {
    color: tileKeeperTheme.colours.primary,
    fontWeight: '800',
  },
  tagChipTextSelected: {
    color: tileKeeperTheme.colours.frame,
  },
  tagCount: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 12,
    fontWeight: '900',
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  layoutCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.sheet,
    borderWidth: 1,
    padding: 16,
  },
  cardBodyRow: {
    flexDirection: 'row',
    gap: 14,
  },
  thumbnail: {
    alignContent: 'center',
    backgroundColor: tileKeeperTheme.colours.frame,
    borderRadius: tileKeeperTheme.radius.card,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    height: 76,
    justifyContent: 'center',
    padding: 8,
    width: 76,
  },
  thumbnailCell: {
    backgroundColor: '#3D3328',
    borderRadius: 4,
    height: 16,
    width: 16,
  },
  thumbnailCellFilled: {
    backgroundColor: tileKeeperTheme.colours.secondaryBright,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardTitleBlock: {
    flex: 1,
  },
  layoutTitle: {
    color: tileKeeperTheme.colours.text,
    fontSize: 20,
    fontWeight: '900',
  },
  layoutSubtitle: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  favouriteButton: {
    minHeight: tileKeeperTheme.touch.minimum,
    minWidth: tileKeeperTheme.touch.minimum,
  },
  favouriteIcon: {
    color: tileKeeperTheme.colours.secondary,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
  },
  goalText: {
    color: tileKeeperTheme.colours.text,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 12,
  },
  notesText: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  cardTag: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderRadius: 999,
    color: tileKeeperTheme.colours.primary,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    minHeight: tileKeeperTheme.touch.minimum,
  },
  deleteButtonText: {
    color: tileKeeperTheme.colours.danger,
    fontWeight: '900',
  },
  errorText: {
    backgroundColor: '#FCE6D8',
    borderColor: tileKeeperTheme.colours.danger,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    color: tileKeeperTheme.colours.danger,
    fontWeight: '800',
    padding: 12,
  },
  shimmerStack: {
    gap: 12,
    paddingBottom: 32,
  },
});
