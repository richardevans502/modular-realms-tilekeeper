import { StyleSheet, Text, View } from 'react-native';

import type { SolverInsightViewModel } from './solverInsightViewModel';
import { tileKeeperTheme } from '../ui/theme';

export interface SolverInsightPanelProps {
  model: SolverInsightViewModel;
}

export function SolverInsightPanel({ model }: SolverInsightPanelProps) {
  return (
    <View style={styles.panelStack}>
      <View style={[styles.banner, styles[`${model.statusBanner.tone}Banner`]]}>
        <Text style={styles.bannerTitle}>{model.statusBanner.title}</Text>
        <Text style={styles.bannerMessage}>{model.statusBanner.message}</Text>
      </View>

      <View style={styles.statGrid}>
        {model.traceSummary.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statDetail}>{stat.detail}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Rejected candidate breakdown</Text>
        {model.rejectionBreakdown.length === 0 ? (
          <Text style={styles.emptyText}>No rejected candidates on this run.</Text>
        ) : (
          model.rejectionBreakdown.map((row) => (
            <View key={row.reason} style={styles.breakdownRow}>
              <Text style={styles.breakdownReason}>{row.reason}</Text>
              <Text style={styles.breakdownCount}>{row.count}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Missing-tile suggestions</Text>
        {model.missingTileRows.length === 0 ? (
          <Text style={styles.emptyText}>{model.emptySuggestionsMessage}</Text>
        ) : (
          model.missingTileRows.map((row) => (
            <View key={row.id} style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>{row.title}</Text>
                <Text style={styles.badge}>{row.badge}</Text>
              </View>
              <Text style={styles.suggestionSubtitle}>{row.subtitle}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelStack: {
    gap: tileKeeperTheme.spacing.md,
  },
  banner: {
    borderRadius: tileKeeperTheme.radius.sheet,
    borderWidth: 2,
    padding: tileKeeperTheme.spacing.lg,
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: tileKeeperTheme.colours.success,
  },
  warningBanner: {
    backgroundColor: '#FFF7DB',
    borderColor: tileKeeperTheme.colours.warning,
  },
  errorBanner: {
    backgroundColor: '#FFF0EB',
    borderColor: tileKeeperTheme.colours.danger,
  },
  bannerTitle: {
    color: tileKeeperTheme.colours.text,
    fontSize: 20,
    fontWeight: '900',
  },
  bannerMessage: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: tileKeeperTheme.spacing.xs,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tileKeeperTheme.spacing.sm,
  },
  statCard: {
    minWidth: 118,
    flexGrow: 1,
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    padding: tileKeeperTheme.spacing.md,
  },
  statLabel: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statValue: {
    color: tileKeeperTheme.colours.frame,
    fontSize: 28,
    fontWeight: '900',
  },
  statDetail: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 12,
  },
  sectionCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    gap: tileKeeperTheme.spacing.sm,
    padding: tileKeeperTheme.spacing.lg,
  },
  sectionTitle: {
    color: tileKeeperTheme.colours.text,
    fontSize: 18,
    fontWeight: '900',
  },
  breakdownRow: {
    alignItems: 'center',
    borderTopColor: tileKeeperTheme.colours.raisedSurface,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: tileKeeperTheme.spacing.sm,
  },
  breakdownReason: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  breakdownCount: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  suggestionCard: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderRadius: tileKeeperTheme.radius.card,
    padding: tileKeeperTheme.spacing.md,
  },
  suggestionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tileKeeperTheme.spacing.sm,
    justifyContent: 'space-between',
  },
  suggestionTitle: {
    color: tileKeeperTheme.colours.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  suggestionSubtitle: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginTop: tileKeeperTheme.spacing.xs,
  },
  badge: {
    backgroundColor: tileKeeperTheme.colours.primary,
    borderRadius: 999,
    color: tileKeeperTheme.colours.onFrame,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
});
