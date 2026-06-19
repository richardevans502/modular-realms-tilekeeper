import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tileKeeperTheme } from '../ui/theme';
import { DIAGNOSTICS_DECISION, buildLocalDiagnosticLog, diagnosticsConsentCopy } from './localDiagnostics';
import { exportAndShareDiagnostics } from './settingsDiagnosticsViewModel';

export function SettingsDiagnosticsScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'idle' | 'exporting' | 'shared' | 'error'>('idle');
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const handleExportDiagnostics = async () => {
    setStatus('exporting');
    const result = await exportAndShareDiagnostics(buildLocalDiagnosticLog());
    if (result.success) {
      setLastFileName(result.fileName);
      setStatus('shared');
      Alert.alert('Diagnostics ready', `${result.fileName} was created in app documents and opened in the native share sheet.`);
      return;
    }
    setStatus('error');
    Alert.alert('Diagnostics export failed', result.error);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: 16 + insets.top }]}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Settings</Text>
        <Text style={styles.title}>Diagnostics</Text>
        <Text style={styles.subtitle}>
          Local-only diagnostics are generated only when you ask for them, then shared through your device's native share sheet.
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Crash/error monitoring decision</Text>
        <Text style={styles.sectionBody}>
          Decision: {DIAGNOSTICS_DECISION.approach}. Approved by {DIAGNOSTICS_DECISION.approvedBy} on {DIAGNOSTICS_DECISION.approvedAt}.
        </Text>
        <Text style={styles.sectionBody}>{DIAGNOSTICS_DECISION.rationale}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>What the export contains</Text>
        <Text style={styles.monoText}>{diagnosticsConsentCopy()}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Export local diagnostics</Text>
        <Text style={styles.sectionBody}>
          TileKeeper writes a structured JSON diagnostic log to the app documents directory, then opens the native share sheet so you choose where it goes.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Export diagnostics JSON"
          style={[styles.primaryButton, status === 'exporting' ? styles.buttonDisabled : null]}
          disabled={status === 'exporting'}
          onPress={() => void handleExportDiagnostics()}
        >
          <Text style={styles.primaryButtonText}>{status === 'exporting' ? 'Preparing diagnostics…' : 'Export diagnostics JSON'}</Text>
        </TouchableOpacity>
        {lastFileName ? <Text style={styles.successText}>Last export: {lastFileName}</Text> : null}
        {status === 'error' ? <Text style={styles.errorText}>Export failed. No diagnostics were shared.</Text> : null}
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
  sectionCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
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
  monoText: {
    color: tileKeeperTheme.colours.text,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: tileKeeperTheme.colours.onFrame,
    fontSize: 15,
    fontWeight: '900',
  },
  successText: {
    color: tileKeeperTheme.colours.success,
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    color: tileKeeperTheme.colours.danger,
    fontSize: 13,
    fontWeight: '800',
  },
});
