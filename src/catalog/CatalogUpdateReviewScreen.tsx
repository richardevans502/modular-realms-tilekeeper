import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tileKeeperTheme } from '../ui/theme';
import type { CatalogConflictAction, CatalogConflictResolution, CatalogUpdateReviewViewModel } from './catalogUpdateReviewViewModel';
import { applyCatalogConflictResolution } from './catalogUpdateReviewViewModel';

export interface CatalogUpdateReviewScreenProps {
  model: CatalogUpdateReviewViewModel;
  onAccept?: (conflicts: CatalogConflictResolution[]) => void;
  onDefer?: () => void;
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryPill} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ConflictCard({ conflict, onSelect }: { conflict: CatalogConflictResolution; onSelect: (action: CatalogConflictAction) => void }) {
  return (
    <View style={styles.conflictCard}>
      <Text style={styles.warningBadge}>ID conflict</Text>
      <Text style={styles.itemTitle}>{conflict.customName} ↔ {conflict.officialName}</Text>
      <Text style={styles.sectionBody}>{conflict.message}</Text>
      <View style={styles.choiceRow}>
        {conflict.choices.map((choice) => {
          const selected = choice.action === conflict.selectedAction;
          return (
            <TouchableOpacity
              key={choice.action}
              accessibilityRole="button"
              accessibilityLabel={choice.label}
              accessibilityState={{ selected }}
              style={[styles.choiceButton, selected ? styles.choiceButtonSelected : null]}
              onPress={() => onSelect(choice.action)}
            >
              <Text style={[styles.choiceButtonText, selected ? styles.choiceButtonTextSelected : null]}>{choice.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function CatalogUpdateReviewScreen({ model, onAccept, onDefer }: CatalogUpdateReviewScreenProps) {
  const insets = useSafeAreaInsets();
  const [conflicts, setConflicts] = useState(model.conflicts);
  const counts = model.summaryCounts;
  const acceptLabel = model.canAcceptUpdate ? model.primaryActionLabel : 'App update needed';

  const hasChanges = useMemo(
    () => counts.added + counts.removed + counts.changed + counts.discontinued + counts.conflicts > 0,
    [counts.added, counts.changed, counts.conflicts, counts.discontinued, counts.removed],
  );

  const selectConflictAction = (tileId: string, action: CatalogConflictAction) => {
    setConflicts((current) => current.map((conflict) => (conflict.tileId === tileId ? applyCatalogConflictResolution(conflict, action) : conflict)));
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: 16 + insets.top }]} accessibilityLabel="Catalog update review">
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Catalog refresh</Text>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.subtitle}>{model.subtitle}</Text>
        {model.catalogVersion ? <Text style={styles.catalogVersion}>Version {model.catalogVersion}</Text> : null}
      </View>

      {model.schemaWarning ? (
        <View style={styles.schemaWarningCard} accessibilityRole="alert">
          <Text style={styles.warningBadge}>Schema upgrade</Text>
          <Text style={styles.sectionTitle}>{model.schemaWarning.title}</Text>
          <Text style={styles.sectionBody}>{model.schemaWarning.message}</Text>
        </View>
      ) : null}

      <View style={styles.summaryGrid}>
        <SummaryPill label="New" value={counts.added} />
        <SummaryPill label="Removed" value={counts.removed} />
        <SummaryPill label="Changed" value={counts.changed} />
        <SummaryPill label="Discontinued" value={counts.discontinued} />
        <SummaryPill label="Conflicts" value={counts.conflicts} />
      </View>

      {!hasChanges && model.emptyMessage ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>No action needed</Text>
          <Text style={styles.sectionBody}>{model.emptyMessage}</Text>
        </View>
      ) : null}

      {model.sections.map((section) => (
        <View key={section.kind} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <View key={`${section.kind}-${item.tileId}`} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={[styles.statusBadge, item.severity === 'warning' ? styles.statusBadgeWarning : null]}>{item.badge}</Text>
              </View>
              <Text style={styles.sectionBody}>{item.description}</Text>
              {item.impact ? <Text style={styles.impactText}>{item.impact}</Text> : null}
            </View>
          ))}
        </View>
      ))}

      {conflicts.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Custom tile conflicts</Text>
          <Text style={styles.sectionBody}>Official catalog IDs are stable, so custom tiles using the same IDs need an explicit decision before the update is accepted.</Text>
          {conflicts.map((conflict) => (
            <ConflictCard key={conflict.tileId} conflict={conflict} onSelect={(action) => selectConflictAction(conflict.tileId, action)} />
          ))}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={acceptLabel}
          accessibilityState={{ disabled: !model.canAcceptUpdate }}
          disabled={!model.canAcceptUpdate}
          style={[styles.primaryButton, !model.canAcceptUpdate ? styles.buttonDisabled : null]}
          onPress={() => onAccept?.(conflicts)}
        >
          <Text style={styles.primaryButtonText}>{acceptLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={model.secondaryActionLabel} style={styles.secondaryButton} onPress={onDefer}>
          <Text style={styles.secondaryButtonText}>{model.secondaryActionLabel}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tileKeeperTheme.colours.background,
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: tileKeeperTheme.colours.frame,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  eyebrow: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: tileKeeperTheme.colours.onFrame,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  catalogVersion: {
    color: tileKeeperTheme.colours.secondary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryPill: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 96,
    padding: 12,
  },
  summaryValue: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  summaryLabel: {
    color: tileKeeperTheme.colours.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  schemaWarningCard: {
    backgroundColor: `${tileKeeperTheme.colours.danger}18`,
    borderColor: tileKeeperTheme.colours.danger,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  sectionTitle: {
    color: tileKeeperTheme.colours.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionBody: {
    color: tileKeeperTheme.colours.text,
    fontSize: 14,
    lineHeight: 20,
  },
  itemCard: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  itemTitle: {
    color: tileKeeperTheme.colours.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  statusBadge: {
    backgroundColor: `${tileKeeperTheme.colours.primary}22`,
    borderRadius: 999,
    color: tileKeeperTheme.colours.primary,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  statusBadgeWarning: {
    backgroundColor: `${tileKeeperTheme.colours.danger}22`,
    color: tileKeeperTheme.colours.danger,
  },
  warningBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${tileKeeperTheme.colours.danger}22`,
    borderRadius: 999,
    color: tileKeeperTheme.colours.danger,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  impactText: {
    color: tileKeeperTheme.colours.secondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  conflictCard: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.danger,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceButton: {
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceButtonSelected: {
    backgroundColor: tileKeeperTheme.colours.primary,
    borderColor: tileKeeperTheme.colours.primary,
  },
  choiceButtonText: {
    color: tileKeeperTheme.colours.text,
    fontSize: 12,
    fontWeight: '800',
  },
  choiceButtonTextSelected: {
    color: tileKeeperTheme.colours.onFrame,
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: tileKeeperTheme.colours.onFrame,
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: tileKeeperTheme.colours.text,
    fontSize: 15,
    fontWeight: '900',
  },
});
