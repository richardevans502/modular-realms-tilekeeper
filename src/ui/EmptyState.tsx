import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tileKeeperTheme } from './theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon ? <Text style={styles.icon} accessibilityLabel={icon} allowFontScaling>{icon}</Text> : null}
      <Text style={styles.title} allowFontScaling>{title}</Text>
      <Text style={styles.message} allowFontScaling>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    gap: 8,
    padding: 24,
  },
  icon: { fontSize: 32 },
  title: {
    color: tileKeeperTheme.colours.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
