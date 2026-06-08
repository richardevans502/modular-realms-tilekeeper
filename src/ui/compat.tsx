/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/* ------------------------------------------------------------------
 * Cross-platform shims for react-native-web gaps:
 *   - ActivityIndicator (missing type export)
 *   - Switch            (missing type export)
 *   - Modal             (missing type export)
 * Plus helpers to safely pass props that react-native-web types omit:
 *   - FlatList scrollEnabled
 *   - Text    numberOfLines
 *   - TextInput numberOfLines
 * ------------------------------------------------------------------ */

export function ActivityIndicator({ size, color }: { size?: 'small' | 'large'; color?: string }) {
  return (
    <View
      style={[
        styles.spinner,
        size === 'large' ? styles.spinnerLarge : styles.spinnerSmall,
        { borderColor: color ?? '#800000' },
      ]}
    >
      <Text style={[styles.spinnerText, { color: color ?? '#800000' }]}>⟳</Text>
    </View>
  );
}

export function Switch({
  value,
  onValueChange,
  thumbColor,
  trackColor,
  accessibilityLabel,
}: {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  thumbColor?: string;
  trackColor?: { false?: string; true?: string };
  accessibilityLabel?: string;
}) {
  const active = value ?? false;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onValueChange?.(!active)}
      style={[
        styles.switchTrack,
        { backgroundColor: active ? trackColor?.true ?? '#009E73' : trackColor?.false ?? '#C99731' },
      ]}
    >
      <View
        style={[
          styles.switchThumb,
          {
            backgroundColor: thumbColor ?? '#FFFDF7',
            transform: [{ translateX: active ? 18 : 0 }],
          },
        ]}
      />
    </Pressable>
  );
}

export function Modal({
  visible,
  children,
  onRequestClose,
}: {
  visible?: boolean;
  children?: React.ReactNode;
  onRequestClose?: () => void;
}) {
  if (!visible) return null;
  const Overlay: any = View;
  const Content: any = View;
  return (
    <Overlay style={styles.modalOverlay} onClick={onRequestClose}>
      <Content style={styles.modalContent}>{children}</Content>
    </Overlay>
  );
}

/* Helper to cast FlatList props that react-native-web types omit */
export function flatListProps<T>(props: {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: { item: T; index: number }) => React.ReactElement | null;
  scrollEnabled?: boolean;
}): Record<string, unknown> {
  return props as unknown as Record<string, unknown>;
}

/* Helper to cast Text props that react-native-web types omit */
export function textProps(props: { numberOfLines?: number; children?: React.ReactNode; style?: unknown }): Record<string, unknown> {
  return props as unknown as Record<string, unknown>;
}

/* Helper to cast TextInput props that react-native-web types omit */
export function textInputProps(
  props: React.ComponentProps<typeof TextInput> & { numberOfLines?: number },
): Record<string, unknown> {
  return props as unknown as Record<string, unknown>;
}

const styles = StyleSheet.create({
  spinner: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    justifyContent: 'center',
  },
  spinnerSmall: {
    height: 16,
    width: 16,
  },
  spinnerLarge: {
    height: 24,
    width: 24,
  },
  spinnerText: {
    fontSize: 10,
    fontWeight: '900',
  },
  switchTrack: {
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 44,
  },
  switchThumb: {
    borderRadius: 999,
    height: 20,
    width: 20,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'fixed',
    right: 0,
    top: 0,
    zIndex: 1000,
  } as any,
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
    maxWidth: 480,
    padding: 24,
    width: '90%',
  } as any,
});
