import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  buildSavedLayoutsViewModel,
  type SavedLayoutLibraryItem,
  type SavedLayoutsFilterState,
} from './savedLayoutsViewModel';

export interface SavedLayoutsScreenProps {
  layouts: SavedLayoutLibraryItem[];
}

export function SavedLayoutsScreen({ layouts }: SavedLayoutsScreenProps) {
  const [filters, setFilters] = useState<SavedLayoutsFilterState>({
    searchText: '',
    selectedTags: [],
    favouritesOnly: false,
  });

  const viewModel = useMemo(() => buildSavedLayoutsViewModel(layouts, filters), [layouts, filters]);

  const toggleTag = (tag: string) => {
    setFilters((current) => ({
      ...current,
      selectedTags: current.selectedTags.includes(tag)
        ? current.selectedTags.filter((selectedTag) => selectedTag !== tag)
        : [...current.selectedTags, tag],
    }));
  };

  const clearFilters = () => {
    setFilters({ searchText: '', selectedTags: [], favouritesOnly: false });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Library</Text>
        <Text style={styles.title}>Saved layouts</Text>
        <Text style={styles.subtitle}>Find favourites, campaign maps, and quick rebuild plans before the tabletop goblins scatter your tiles.</Text>
        <View style={styles.statsRow}>
          <StatPill label="Saved" value={viewModel.totalCount} />
          <StatPill label="Favourites" value={viewModel.favouriteCount} />
          <StatPill label="Showing" value={viewModel.filteredCount} />
        </View>
      </View>

      <View style={styles.searchCard}>
        <TextInput
          accessibilityLabel="Search saved layouts"
          placeholder="Search by name, tag, goal, or notes"
          placeholderTextColor="#94a3b8"
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

      <ScrollView contentContainerStyle={styles.listContent}>
        {viewModel.emptyState ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{viewModel.emptyState.title}</Text>
            <Text style={styles.emptyMessage}>{viewModel.emptyState.message}</Text>
          </View>
        ) : (
          viewModel.rows.map((layout) => (
            <TouchableOpacity accessibilityRole="button" key={layout.id} style={styles.layoutCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.layoutTitle}>{layout.title}</Text>
                  <Text style={styles.layoutSubtitle}>{layout.subtitle}</Text>
                </View>
                <Text style={styles.favouriteIcon}>{layout.isFavourite ? '★' : '☆'}</Text>
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
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 18,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#1e293b',
    borderColor: '#f59e0b',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  eyebrow: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: '#cbd5e1',
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
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statValue: {
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  searchCard: {
    backgroundColor: '#172033',
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  searchInput: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderRadius: 16,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    borderColor: '#475569',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterButtonSelected: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  filterButtonText: {
    color: '#e2e8f0',
    fontWeight: '800',
  },
  filterButtonTextSelected: {
    color: '#1e293b',
  },
  clearButton: {
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  clearButtonText: {
    color: '#93c5fd',
    fontWeight: '800',
  },
  tagsRow: {
    gap: 8,
    paddingRight: 10,
  },
  tagChip: {
    alignItems: 'center',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipSelected: {
    backgroundColor: '#fde68a',
    borderColor: '#fde68a',
  },
  tagChipText: {
    color: '#dbeafe',
    fontWeight: '800',
  },
  tagChipTextSelected: {
    color: '#1f2937',
  },
  tagCount: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '900',
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  layoutCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    padding: 16,
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
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
  },
  layoutSubtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  favouriteIcon: {
    color: '#f59e0b',
    fontSize: 26,
    fontWeight: '900',
  },
  goalText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 12,
  },
  notesText: {
    color: '#64748b',
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
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 28,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
  },
  emptyMessage: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
});
