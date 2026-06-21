import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getAccessibleStateTreatment, tileKeeperTheme } from './theme';

interface AccessibleBadgeProps {
  state: 'selected' | 'success' | 'warning' | 'danger' | 'missing';
  showLabel?: boolean;
}

export function AccessibleBadge({ state, showLabel = true }: AccessibleBadgeProps) {
  const treatment = getAccessibleStateTreatment(state);
  return (
    <View
      style={[styles.badge, { borderColor: treatment.colour, backgroundColor: treatment.colour + '18' }]}
      accessibilityLabel={`${treatment.label} status`}
      accessibilityRole="text"
    >
      <Text style={[styles.icon, { color: treatment.colour }]} accessibilityLabel={treatment.label}>
        {treatment.icon}
      </Text>
      {showLabel ? (
        <Text style={[styles.label, { color: treatment.colour }]}>
          {treatment.label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  icon: { fontSize: 12, fontWeight: '900' },
  label: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
});
