import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

      <CollapsibleSection title="Trace Summary" initiallyExpanded>
        <Text style={styles.foundSummary}>{model.foundSummary}</Text>
        <View style={styles.statGrid}>
          {model.traceSummary.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statDetail}>{stat.detail}</Text>
            </View>
          ))}
        </View>
      </CollapsibleSection>

      <CollapsibleSection title="Rejected Placements" initiallyExpanded={model.rejectedCandidateRows.length > 0}>
        {model.rejectionBreakdown.length === 0 ? (
          <Text style={styles.emptyText}>No rejected candidates on this run.</Text>
        ) : (
          <>
            {model.rejectionBreakdown.map((row) => (
              <View key={row.reason} style={styles.breakdownRow}>
                <Text style={styles.breakdownReason}>{row.reason}</Text>
                <Text style={styles.breakdownCount}>{row.count}</Text>
              </View>
            ))}
            {model.rejectedCandidateRows.map((row) => (
              <View key={row.id} style={styles.rejectedCard}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionTitle}>{row.title}</Text>
                  <Text style={styles.badge}>{row.reason}</Text>
                </View>
                <Text style={styles.suggestionSubtitle}>{row.detail}</Text>
              </View>
            ))}
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Missing Tile Suggestions" initiallyExpanded={model.missingTileRows.length > 0}>
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
      </CollapsibleSection>
    </View>
  );
}

function CollapsibleSection({
  title,
  initiallyExpanded = false,
  children,
}: {
  title: string;
  initiallyExpanded?: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={styles.sectionHeader}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionToggle}>{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>
      {expanded ? <View style={styles.sectionBody}>{children}</View> : null}
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
  foundSummary: {
    color: tileKeeperTheme.colours.secondaryBright,
    fontSize: 16,
    fontWeight: '900',
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
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionBody: {
    gap: tileKeeperTheme.spacing.sm,
  },
  sectionTitle: {
    color: tileKeeperTheme.colours.text,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionToggle: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 24,
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
  rejectedCard: {
    backgroundColor: '#FFF7DB',
    borderColor: tileKeeperTheme.colours.warning,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
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
