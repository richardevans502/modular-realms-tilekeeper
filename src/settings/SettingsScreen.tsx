import { useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { refreshCatalogFromManifest, type CatalogRefreshError } from '../catalog/catalogRefresh';
import { initTileKeeperDatabase, type TileKeeperPersistence } from '../db/init';
import type { TileKeeperDatabase } from '../db/runMigrations';
import { buildLocalDiagnosticLog, getDiagnosticSolverRuns } from '../diagnostics/localDiagnostics';
import { exportAndShareDiagnostics } from '../diagnostics/settingsDiagnosticsViewModel';
import { exportBackupJson, importBackupJson } from '../export/exportViewModel';
import { shareJsonExport } from '../export/shareExportFiles';
import { SOLVER_VERSION } from '../layout/layoutSolver';
import type { TileType } from '../shared/types';
import { Switch, textInputProps } from '../ui/compat';
import { tileKeeperTheme } from '../ui/theme';
import {
  buildAboutSettingsModel,
  buildCatalogSettingsModel,
  buildDiagnosticsSettingsModel,
  nextAppearanceMode,
  parseSettingsBackupImport,
  formatUtcDateTime,
  type AppearanceMode,
  type CatalogPackSettingsRow,
} from './settingsViewModel';

export interface SettingsScreenProps {
  persistence?: TileKeeperPersistence;
  manifestUrl?: string;
}

type BusyAction = 'catalog' | 'backup-export' | 'backup-import' | 'diagnostics' | null;

const APPEARANCE_KEY = 'tilekeeper.appearanceMode';
const LAST_BACKUP_KEY = 'settings.lastBackupAt';
const LAST_CATALOG_REFRESH_KEY = 'settings.lastCatalogRefreshAt';
const DEFAULT_MANIFEST_URL = 'https://catalog.modularrealms.example/manifest.json';
const PRIVACY_POLICY_URL = 'https://richardevans502.github.io/modular-realms-tilekeeper/PRIVACY_POLICY.md';

function triggerWebDownload(filename: string, content: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function readSetting(db: TileKeeperDatabase | undefined, key: string): Promise<string | null> {
  if (!db) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }
  const row = await db.getFirstAsync<{ value_json: string }>('SELECT value_json FROM app_settings WHERE key = ?', [key]);
  if (!row) return null;
  try {
    return JSON.parse(row.value_json) as string;
  } catch {
    return null;
  }
}

async function writeSetting(db: TileKeeperDatabase | undefined, key: string, value: string): Promise<void> {
  if (!db) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  if (!db.runAsync) return;
  await db.runAsync(
    `INSERT INTO app_settings (key, value_json, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`,
    [key, JSON.stringify(value)],
  );
}

async function listCatalogPacks(db: TileKeeperDatabase): Promise<CatalogPackSettingsRow[]> {
  if (!db.getAllAsync) return [];
  const rows = await db.getAllAsync<{ id: string; version: string; updated_at: string | null }>(
    'SELECT id, version, updated_at FROM catalog_packs ORDER BY id',
  );
  return rows.map((row) => ({ id: row.id, version: row.version, updatedAt: row.updated_at }));
}

export function SettingsScreen({ persistence: injectedPersistence, manifestUrl = DEFAULT_MANIFEST_URL }: SettingsScreenProps) {
  const [persistence, setPersistence] = useState<TileKeeperPersistence | null>(injectedPersistence ?? null);
  const [catalogTiles, setCatalogTiles] = useState<TileType[]>([]);
  const [catalogPacks, setCatalogPacks] = useState<CatalogPackSettingsRow[]>([]);
  const [lastCatalogRefreshAt, setLastCatalogRefreshAt] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>('light');
  const [backupText, setBackupText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  const db = persistence?.db as TileKeeperDatabase | undefined;
  const screenTheme = appearanceMode === 'dark' ? darkTileKeeperTheme : tileKeeperTheme;
  const styles = useMemo(() => createStyles(screenTheme), [screenTheme]);

  const refreshLocalState = useCallback(async (activePersistence: TileKeeperPersistence) => {
    const activeDb = activePersistence.db as TileKeeperDatabase;
    const [tiles, packs, savedAppearance, savedBackupAt, savedCatalogRefreshAt] = await Promise.all([
      activePersistence.catalogRepository.listTileTypes(),
      listCatalogPacks(activeDb),
      readSetting(activeDb, APPEARANCE_KEY),
      readSetting(activeDb, LAST_BACKUP_KEY),
      readSetting(activeDb, LAST_CATALOG_REFRESH_KEY),
    ]);
    setCatalogTiles(tiles);
    setCatalogPacks(packs);
    if (savedAppearance === 'dark' || savedAppearance === 'light') setAppearanceMode(savedAppearance);
    setLastBackupAt(savedBackupAt);
    setLastCatalogRefreshAt(savedCatalogRefreshAt);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (injectedPersistence) {
        await refreshLocalState(injectedPersistence);
        return;
      }
      try {
        const opened = await initTileKeeperDatabase();
        if (cancelled) return;
        setPersistence(opened);
        await refreshLocalState(opened);
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : 'Settings could not open the offline database.');
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [injectedPersistence, refreshLocalState]);

  const catalogModel = buildCatalogSettingsModel({ tiles: catalogTiles, packs: catalogPacks, refreshedAt: lastCatalogRefreshAt });
  const aboutModel = buildAboutSettingsModel({
    appVersion: Constants.expoConfig?.version ?? '0.1.0',
    solverVersion: SOLVER_VERSION,
    catalogVersion: catalogModel.catalogVersion,
    buildNumber: Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode?.toString() ?? 'development',
  });
  const diagnosticsModel = buildDiagnosticsSettingsModel(getDiagnosticSolverRuns());
  const backupValidation = backupText.trim() ? parseSettingsBackupImport(backupText) : null;

  const setBusy = (action: BusyAction, message: string | null = null) => {
    setBusyAction(action);
    setStatusMessage(message);
    setErrorMessage(null);
  };

  const handleCatalogRefresh = async () => {
    if (!persistence) return;
    setBusy('catalog', 'Checking catalog manifest…');
    try {
      const result = await refreshCatalogFromManifest({ manifestUrl, db: persistence.db as TileKeeperDatabase });
      const refreshedAt = new Date().toISOString();
      await writeSetting(db, LAST_CATALOG_REFRESH_KEY, refreshedAt);
      setLastCatalogRefreshAt(refreshedAt);
      await refreshLocalState(persistence);
      setStatusMessage(`Catalog updated to ${result.catalogVersion}; ${result.tilesUpserted} tiles refreshed.`);
    } catch (error) {
      const catalogError = error as CatalogRefreshError;
      setErrorMessage(catalogError.userMessage ?? (error instanceof Error ? error.message : 'Catalog refresh failed. Offline catalog is unchanged.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportBackup = async () => {
    if (!persistence) return;
    setBusy('backup-export', 'Preparing full backup…');
    try {
      const json = await exportBackupJson({
        catalogRepository: persistence.catalogRepository,
        inventoryRepository: persistence.inventoryRepository,
        savedLayoutRepository: persistence.savedLayoutRepository,
      });
      const exportedAt = new Date().toISOString();
      const fileName = `tilekeeper-backup-${exportedAt.split('T')[0]}.json`;
      if (Platform.OS === 'web') {
        triggerWebDownload(fileName, json);
      } else {
        const result = await shareJsonExport(fileName, json);
        if (!result.success) throw new Error(result.error);
      }
      await writeSetting(db, LAST_BACKUP_KEY, exportedAt);
      setLastBackupAt(exportedAt);
      setStatusMessage(`Backup exported: ${fileName}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Backup export failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportBackup = async () => {
    if (!persistence || !backupValidation?.valid) return;
    setBusy('backup-import', 'Validating and restoring backup…');
    const result = await importBackupJson(backupText, {
      catalogRepository: persistence.catalogRepository,
      inventoryRepository: persistence.inventoryRepository,
      savedLayoutRepository: persistence.savedLayoutRepository,
    }, { mode: 'replace' });
    setBusyAction(null);
    if (result.success) {
      setBackupText('');
      await refreshLocalState(persistence);
      setStatusMessage('Backup restored successfully. Offline data has been refreshed.');
      return;
    }
    setErrorMessage(result.error);
  };

  const handleAppearanceToggle = async () => {
    const next = nextAppearanceMode(appearanceMode);
    setAppearanceMode(next);
    await writeSetting(db, APPEARANCE_KEY, next);
    setStatusMessage(`Appearance set to ${next} mode.`);
  };

  const handleExportDiagnostics = async () => {
    setBusy('diagnostics', 'Preparing diagnostics export…');
    const log = buildLocalDiagnosticLog();
    if (Platform.OS === 'web') {
      const fileName = `tilekeeper-diagnostics-${log.generatedAt.replace(/[:.]/g, '-')}.json`;
      triggerWebDownload(fileName, JSON.stringify(log, null, 2));
      setBusyAction(null);
      setStatusMessage(`Diagnostics exported: ${fileName}`);
      return;
    }
    const result = await exportAndShareDiagnostics(log);
    setBusyAction(null);
    if (result.success) {
      setStatusMessage(`Diagnostics exported: ${result.fileName}`);
      return;
    }
    setErrorMessage(result.error);
  };

  const openPrivacyPolicy = async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert('Privacy policy', PRIVACY_POLICY_URL);
    }
  };

  const actionDisabled = Boolean(busyAction) || !persistence;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>TileKeeper</Text>
        <Text style={styles.title} allowFontScaling>Settings</Text>
        <Text style={styles.subtitle} allowFontScaling>Offline-first controls for catalog data, backups, appearance, diagnostics, privacy, and app metadata.</Text>
      </View>

      {statusMessage ? <Text style={styles.successText} accessibilityRole="status">{statusMessage}</Text> : null}
      {errorMessage ? <Text style={styles.errorText} accessibilityRole="alert">{errorMessage}</Text> : null}

      <SettingsSection title="Catalog" description="Refresh signed catalog manifests and inspect the offline catalog currently stored on this device." styles={styles}>
        <MetaRow label="Current catalog version" value={catalogModel.catalogVersion} styles={styles} />
        <MetaRow label="Catalog packs" value={catalogModel.packList.length ? catalogModel.packList.join(', ') : 'No downloaded packs yet'} styles={styles} />
        <MetaRow label="Tiles available offline" value={String(catalogModel.tileCount)} styles={styles} />
        <MetaRow label="Last updated" value={catalogModel.lastUpdatedLabel} styles={styles} />
        <PrimaryButton label={busyAction === 'catalog' ? 'Checking…' : 'Check for updates'} disabled={actionDisabled} onPress={handleCatalogRefresh} styles={styles} />
      </SettingsSection>

      <SettingsSection title="Backup & Restore" description="Export a complete JSON backup or paste a TileKeeper backup file to validate and restore it offline." styles={styles}>
        <MetaRow label="Last backup" value={lastBackupAt ? formatUtcDateTime(lastBackupAt) : 'No backup exported yet'} styles={styles} />
        <PrimaryButton label={busyAction === 'backup-export' ? 'Exporting…' : 'Export full backup'} disabled={actionDisabled} onPress={handleExportBackup} styles={styles} />
        <TextInput
          {...textInputProps({
            accessibilityLabel: 'Paste TileKeeper backup JSON file contents',
            multiline: true,
            numberOfLines: 7,
            onChangeText: setBackupText,
            placeholder: 'Paste backup JSON here to validate before import…',
            placeholderTextColor: screenTheme.colours.mutedText,
            style: styles.textArea,
            value: backupText,
          })}
        />
        {backupValidation ? (
          <Text style={backupValidation.valid ? styles.successText : styles.errorText}>
            {backupValidation.valid ? `Valid backup: ${backupValidation.summary}` : backupValidation.error}
          </Text>
        ) : null}
        <PrimaryButton label={busyAction === 'backup-import' ? 'Importing…' : 'Import validated backup'} disabled={actionDisabled || !backupValidation?.valid} onPress={handleImportBackup} styles={styles} />
      </SettingsSection>

      <SettingsSection title="Appearance" description="Switch this settings surface between light and dark mode; the preference is saved for later sessions." styles={styles}>
        <View style={styles.rowBetween}>
          <View style={styles.rowTextBlock}>
            <Text style={styles.rowLabel}>Dark mode</Text>
            <Text style={styles.rowValue}>Current mode: {appearanceMode}</Text>
          </View>
          <Switch accessibilityLabel="Toggle dark mode" value={appearanceMode === 'dark'} onValueChange={() => void handleAppearanceToggle()} />
        </View>
      </SettingsSection>

      <SettingsSection title="About" description="Build and open-source metadata for support conversations." styles={styles}>
        {aboutModel.rows.map((row) => <MetaRow key={row.label} label={row.label} value={row.value} styles={styles} />)}
        <Text style={styles.monoText}>{aboutModel.openSourceCredits}</Text>
      </SettingsSection>

      <SettingsSection title="Diagnostics" description="Export local-only diagnostic logs and inspect the most recent solver performance telemetry." styles={styles}>
        <MetaRow label="Solver runs captured" value={String(diagnosticsModel.runCount)} styles={styles} />
        <MetaRow label="Latest run" value={diagnosticsModel.latestRunLabel} styles={styles} />
        <MetaRow label="Average duration" value={`${diagnosticsModel.averageDurationMs} ms`} styles={styles} />
        <MetaRow label="Latest solver version" value={diagnosticsModel.latestSolverVersion} styles={styles} />
        <MetaRow label="Latest search" value={`${diagnosticsModel.latestExploredStates} states · ${diagnosticsModel.latestResultCount} results`} styles={styles} />
        <PrimaryButton label={busyAction === 'diagnostics' ? 'Exporting…' : 'Export diagnostic log'} disabled={Boolean(busyAction)} onPress={handleExportDiagnostics} styles={styles} />
      </SettingsSection>

      <SettingsSection title="Privacy" description="TileKeeper works offline and diagnostics/backups are opt-in local files until you choose to share them." styles={styles}>
        <Text style={styles.sectionBody}>No account, device, network, inventory, layout goal, or seed identifiers are sent by the settings screen. Catalog refresh uses the configured manifest URL only when you tap Check for updates.</Text>
        <PrimaryButton label="Open privacy policy" disabled={false} onPress={openPrivacyPolicy} styles={styles} />
        <Text style={styles.monoText}>{PRIVACY_POLICY_URL}</Text>
      </SettingsSection>
    </ScrollView>
  );
}

function SettingsSection({ title, description, children, styles }: { title: string; description: string; children: React.ReactNode; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle} accessibilityLabel={`${title}. ${description}`} allowFontScaling>{title}</Text>
      <Text style={styles.sectionBody} allowFontScaling>{description}</Text>
      {children}
    </View>
  );
}

function MetaRow({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.rowLabel} allowFontScaling>{label}</Text>
      <Text style={styles.rowValue} allowFontScaling>{value}</Text>
    </View>
  );
}

function PrimaryButton({ label, disabled, onPress, styles }: { label: string; disabled?: boolean; onPress: () => void | Promise<void>; styles: ReturnType<typeof createStyles> }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={() => void onPress()} style={[styles.primaryButton, disabled ? styles.buttonDisabled : null]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

type SettingsTheme = {
  colours: Record<keyof typeof tileKeeperTheme.colours, string>;
  touch: typeof tileKeeperTheme.touch;
};

const darkTileKeeperTheme: SettingsTheme = {
  ...tileKeeperTheme,
  colours: {
    ...tileKeeperTheme.colours,
    background: '#0A0A0A',
    surface: '#171414',
    raisedSurface: '#241F1A',
    frame: '#000000',
    text: '#FFFDF7',
    mutedText: '#D8C9A7',
    primary: '#DAA520',
    primaryPressed: '#B8860B',
  },
};

const createStyles = (theme: SettingsTheme) => StyleSheet.create({
  container: { backgroundColor: theme.colours.background, gap: 16, padding: 16, paddingBottom: 40 },
  heroCard: { backgroundColor: theme.colours.frame, borderColor: theme.colours.border, borderRadius: 18, borderWidth: 1, padding: 20 },
  eyebrow: { color: theme.colours.secondaryBright, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: theme.colours.onFrame, fontSize: 30, fontWeight: '900', marginTop: 4 },
  subtitle: { color: theme.colours.raisedSurface, fontSize: 15, lineHeight: 22, marginTop: 8 },
  sectionCard: { backgroundColor: theme.colours.surface, borderColor: theme.colours.border, borderRadius: 16, borderWidth: 1, gap: 10, padding: 16 },
  sectionTitle: { color: theme.colours.text, fontSize: 20, fontWeight: '900' },
  sectionBody: { color: theme.colours.text, fontSize: 14, lineHeight: 20 },
  metaRow: { borderTopColor: theme.colours.raisedSurface, borderTopWidth: 1, gap: 2, paddingTop: 8 },
  rowBetween: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12, minHeight: tileKeeperTheme.touch.minimum },
  rowTextBlock: { flex: 1, gap: 2 },
  rowLabel: { color: theme.colours.text, fontSize: 14, fontWeight: '900' },
  rowValue: { color: theme.colours.mutedText, fontSize: 14, lineHeight: 20 },
  monoText: { color: theme.colours.text, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  primaryButton: { alignItems: 'center', backgroundColor: theme.colours.primary, borderRadius: 12, minHeight: tileKeeperTheme.touch.preferredButtonHeight, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  primaryButtonText: { color: theme.colours.onFrame, fontSize: 15, fontWeight: '900' },
  buttonDisabled: { opacity: 0.55 },
  textArea: { backgroundColor: theme.colours.background, borderColor: theme.colours.border, borderRadius: 12, borderWidth: 1, color: theme.colours.text, fontFamily: 'monospace', fontSize: 13, minHeight: 148, padding: 12, textAlignVertical: 'top' },
  successText: { color: theme.colours.success, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  errorText: { color: theme.colours.danger, fontSize: 13, fontWeight: '800', lineHeight: 19 },
});
