import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityIndicator, Switch, flatListProps, textProps, textInputProps } from '../ui/compat';
import { EmptyState } from '../ui/EmptyState';
import { ShimmerPlaceholder } from '../ui/ShimmerPlaceholder';
import type { SavedLayoutRepository } from '../db/savedLayoutRepository';
import type { CatalogRepository } from '../db/catalogRepository';
import type { InventoryRepository } from '../db/inventoryRepository';
import type { InventoryItem, Layout, TileType } from '../shared/types';
import { tileKeeperTheme } from '../ui/theme';
import {
  buildExportableLayouts,
  buildPrepSheetHtml,
  buildPrepSheetModel,
  exportBackupJson,
  exportLayoutJson,
  generatePngDataUrl,
  importBackupJson,
  parseImportJson,
  type ExportableLayout,
} from './exportViewModel';
import { shareJsonExport, sharePdfExport, sharePngExport } from './shareExportFiles';

export interface ExportScreenProps {
  catalogRepository?: CatalogRepository;
  inventoryRepository?: InventoryRepository;
  savedLayoutRepository?: Pick<SavedLayoutRepository, 'listLayouts' | 'deleteLayout' | 'upsertLayout'>;
}

type ImportMode = 'replace' | 'merge';

function triggerWebDownload(filename: string, content: string, mimeType = 'application/json'): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function triggerWebDownloadDataUrl(filename: string, dataUrl: string): void {
  if (typeof document === 'undefined') return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function ExportScreen({ catalogRepository, inventoryRepository, savedLayoutRepository }: ExportScreenProps) {
  const insets = useSafeAreaInsets();
  const [layouts, setLayouts] = useState<ExportableLayout[]>([]);
  const [catalogTiles, setCatalogTiles] = useState<TileType[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [importJsonText, setImportJsonText] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');

  const [pngGeneratingId, setPngGeneratingId] = useState<string | null>(null);
  const [pdfGeneratingId, setPdfGeneratingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!savedLayoutRepository || !catalogRepository || !inventoryRepository) {
      setErrorMessage('Repositories not available. Export & Backup requires a running database.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [savedLayouts, tiles, inventory] = await Promise.all([
        savedLayoutRepository.listLayouts(),
        catalogRepository.listTileTypes(),
        inventoryRepository.listInventoryItems(),
      ]);
      setLayouts(buildExportableLayouts(savedLayouts));
      setCatalogTiles(tiles);
      setInventoryItems(inventory);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load export data.');
    } finally {
      setIsLoading(false);
    }
  }, [catalogRepository, inventoryRepository, savedLayoutRepository]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const shareOrDownloadJson = async (filename: string, json: string, dialogTitle = 'Export ready') => {
    if (Platform.OS === 'web') {
      triggerWebDownload(filename, json);
      return;
    }
    const result = await shareJsonExport(filename, json);
    if (!result.success) {
      Alert.alert('Export failed', result.error);
      return;
    }
    Alert.alert(dialogTitle, `${result.fileName} is ready to share.`);
  };

  const handleExportBackup = async () => {
    if (!catalogRepository || !inventoryRepository || !savedLayoutRepository) return;
    try {
      const json = await exportBackupJson({
        catalogRepository,
        inventoryRepository,
        savedLayoutRepository,
      });
      const filename = `tilekeeper-backup-${new Date().toISOString().split('T')[0]}.json`;
      await shareOrDownloadJson(filename, json, 'Backup export ready');
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Could not create backup.');
    }
  };

  const handleImport = async () => {
    if (!catalogRepository || !inventoryRepository || !savedLayoutRepository) return;
    setImportStatus('parsing');
    const parsed = parseImportJson(importJsonText);
    if (parsed.error) {
      setImportStatus('error');
      Alert.alert('Invalid backup', parsed.error);
      return;
    }
    const result = await importBackupJson(importJsonText, {
      catalogRepository,
      inventoryRepository,
      savedLayoutRepository,
    }, { mode: importMode });
    if (result.success) {
      setImportStatus('success');
      setImportJsonText('');
      Alert.alert('Import complete', `Backup restored in ${importMode} mode.`);
      await loadData();
    } else {
      setImportStatus('error');
      Alert.alert('Import failed', result.error);
    }
  };

  const handleExportLayoutJson = async (layout: Layout) => {
    try {
      const json = await exportLayoutJson(layout);
      await shareOrDownloadJson(`layout-${layout.id}.json`, json, 'Layout JSON ready');
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Could not export layout JSON.');
    }
  };

  const handleExportLayoutPng = async (layout: Layout) => {
    setPngGeneratingId(layout.id);
    try {
      const result = await generatePngDataUrl(layout, catalogTiles, 2);
      if (result.dataUrl) {
        if (Platform.OS === 'web') {
          triggerWebDownloadDataUrl(`layout-${layout.id}.png`, result.dataUrl);
        } else {
          const shared = await sharePngExport(`layout-${layout.id}.png`, result.dataUrl);
          if (!shared.success) {
            Alert.alert('PNG export failed', shared.error);
          }
        }
      } else {
        Alert.alert('PNG export failed', result.error ?? 'Unknown error');
      }
    } catch (err) {
      Alert.alert('PNG export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPngGeneratingId(null);
    }
  };

  const handleExportLayoutPdf = async (item: ExportableLayout) => {
    setPdfGeneratingId(item.id);
    try {
      const model = await buildPrepSheetModel({
        exportableLayout: item,
        catalog: catalogTiles,
        inventory: inventoryItems,
      });
      const html = buildPrepSheetHtml(model);
      if (Platform.OS === 'web') {
        triggerWebDownload(`layout-${item.id}-prep-sheet.html`, html, 'text/html');
        return;
      }
      const result = await sharePdfExport(`layout-${item.id}-prep-sheet.pdf`, html);
      if (!result.success) {
        Alert.alert('PDF export failed', result.error);
      }
    } catch (err) {
      Alert.alert('PDF export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPdfGeneratingId(null);
    }
  };

  const renderLayoutItem = ({ item }: { item: ExportableLayout }) => (
    <View style={styles.layoutCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.placementCount} tiles · updated {new Date(item.updatedAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text {...textProps({ numberOfLines: 2, style: styles.cardGoal })} >{item.goal}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Export ${item.name} as JSON`}
          style={styles.actionButton}
          onPress={() => void handleExportLayoutJson(item.layout)}
        >
          <Text style={styles.actionButtonText}>JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Export ${item.name} as PNG`}
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => void handleExportLayoutPng(item.layout)}
          disabled={pngGeneratingId === item.id}
        >
          {pngGeneratingId === item.id ? (
            <ActivityIndicator size="small" color={tileKeeperTheme.colours.primary} />
          ) : (
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>PNG</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Export ${item.name} as PDF prep sheet`}
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => void handleExportLayoutPdf(item)}
          disabled={pdfGeneratingId === item.id}
        >
          {pdfGeneratingId === item.id ? (
            <ActivityIndicator size="small" color={tileKeeperTheme.colours.primary} />
          ) : (
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>PDF</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: tileKeeperTheme.spacing.lg + insets.top }]}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Backup & Share</Text>
        <Text style={styles.title} allowFontScaling>Export & Backup</Text>
        <Text style={styles.subtitle} allowFontScaling>
          Export your catalog, inventory, and saved layouts as JSON backups, share PNG schematics, or generate printable PDF prep sheets.
        </Text>
      </View>

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Full Backup</Text>
        <Text style={styles.sectionBody}>Download a complete JSON backup of your catalog, inventory, and all saved layouts.</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Export full backup JSON"
          style={styles.primaryButton}
          onPress={() => void handleExportBackup()}
          disabled={isLoading || !catalogRepository}
        >
          <Text style={styles.primaryButtonText}>⇪ Export Backup JSON</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Import Backup</Text>
        <Text style={styles.sectionBody}>Paste a TileKeeper backup JSON below to restore catalog, inventory, and layouts.</Text>
        <TextInput
          {...textInputProps({
            accessibilityLabel: 'Backup JSON to import',
            multiline: true,
            numberOfLines: 6,
            placeholder: 'Paste backup JSON here...',
            placeholderTextColor: tileKeeperTheme.colours.mutedText,
            style: styles.jsonInput,
            value: importJsonText,
            onChangeText: (text: string) => {
              setImportJsonText(text);
              setImportStatus('idle');
            },
          })}
        />
        <View style={styles.importModeRow}>
          <Text style={styles.importModeLabel}>Mode: {importMode === 'replace' ? 'Replace all' : 'Merge'}</Text>
          <Switch
            accessibilityLabel="Toggle import mode between replace and merge"
            value={importMode === 'merge'}
            onValueChange={(v: boolean) => setImportMode(v ? 'merge' : 'replace')}
            thumbColor={importMode === 'merge' ? tileKeeperTheme.colours.success : tileKeeperTheme.colours.danger}
            trackColor={{ false: tileKeeperTheme.colours.border, true: tileKeeperTheme.colours.success }}
          />
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Import backup JSON"
          style={[styles.primaryButton, importStatus === 'parsing' ? styles.buttonDisabled : null]}
          onPress={() => void handleImport()}
          disabled={importStatus === 'parsing' || !importJsonText.trim()}
        >
          {importStatus === 'parsing' ? (
            <ActivityIndicator size="small" color={tileKeeperTheme.colours.onFrame} />
          ) : (
            <Text style={styles.primaryButtonText}>⬇ Import Backup</Text>
          )}
        </TouchableOpacity>
        {importStatus === 'success' ? (
          <Text style={styles.successText}>Import completed successfully.</Text>
        ) : null}
        {importStatus === 'error' ? (
          <Text style={styles.errorTextSmall}>Import failed. Check the JSON is a valid TileKeeper backup.</Text>
        ) : null}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Saved Layouts</Text>
        <Text style={styles.sectionBody}>Export individual layouts as JSON, PNG schematics, or printable PDF prep sheets.</Text>
        {isLoading ? (
          <View style={styles.shimmerStack} accessibilityLabel="Loading saved layouts" accessibilityRole="progressbar" accessibilityState={{ busy: true }}>
            <ShimmerPlaceholder height={80} />
            <ShimmerPlaceholder height={80} />
          </View>
        ) : layouts.length === 0 ? (
          <EmptyState icon="📤" title="No saved layouts yet" message="Go to Saved Layouts to create one, then return here to export it." />
        ) : (
          <FlatList
            {...flatListProps({
              data: layouts,
              keyExtractor: (item) => item.id,
              renderItem: renderLayoutItem,
              scrollEnabled: false,
            })}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: tileKeeperTheme.spacing.lg,
    gap: tileKeeperTheme.spacing.lg,
    backgroundColor: tileKeeperTheme.colours.background,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    padding: tileKeeperTheme.spacing.xl,
    gap: tileKeeperTheme.spacing.sm,
  },
  eyebrow: {
    color: tileKeeperTheme.colours.secondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: tileKeeperTheme.colours.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 16,
    lineHeight: 24,
  },
  sectionCard: {
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    padding: tileKeeperTheme.spacing.xl,
    gap: tileKeeperTheme.spacing.md,
  },
  sectionTitle: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionBody: {
    color: tileKeeperTheme.colours.text,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.primary,
    borderRadius: tileKeeperTheme.radius.button,
    justifyContent: 'center',
    minHeight: tileKeeperTheme.touch.preferredButtonHeight,
    paddingHorizontal: tileKeeperTheme.spacing.lg,
    paddingVertical: tileKeeperTheme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: tileKeeperTheme.colours.onFrame,
    fontSize: 16,
    fontWeight: '800',
  },
  jsonInput: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.input,
    borderWidth: 1,
    color: tileKeeperTheme.colours.text,
    fontFamily: tileKeeperTheme.typography.data.fontFamily,
    fontSize: 13,
    lineHeight: 20,
    minHeight: 120,
    padding: tileKeeperTheme.spacing.md,
    textAlignVertical: 'top',
  },
  importModeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  importModeLabel: {
    color: tileKeeperTheme.colours.text,
    fontSize: 15,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: `${tileKeeperTheme.colours.danger}18`,
    borderColor: tileKeeperTheme.colours.danger,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    padding: tileKeeperTheme.spacing.lg,
  },
  errorText: {
    color: tileKeeperTheme.colours.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  errorTextSmall: {
    color: tileKeeperTheme.colours.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  successText: {
    color: tileKeeperTheme.colours.success,
    fontSize: 13,
    fontWeight: '700',
  },
  shimmerStack: {
    gap: 12,
    paddingBottom: 32,
  },
  layoutCard: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    gap: tileKeeperTheme.spacing.sm,
    marginBottom: tileKeeperTheme.spacing.md,
    padding: tileKeeperTheme.spacing.lg,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitleBlock: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: tileKeeperTheme.colours.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 13,
  },
  cardGoal: {
    color: tileKeeperTheme.colours.mutedText,
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: tileKeeperTheme.spacing.md,
    marginTop: tileKeeperTheme.spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.primary,
    borderRadius: tileKeeperTheme.radius.button,
    flex: 1,
    justifyContent: 'center',
    minHeight: tileKeeperTheme.touch.minimum,
    paddingHorizontal: tileKeeperTheme.spacing.md,
    paddingVertical: tileKeeperTheme.spacing.sm,
  },
  actionButtonSecondary: {
    backgroundColor: tileKeeperTheme.colours.raisedSurface,
    borderColor: tileKeeperTheme.colours.border,
    borderWidth: 1,
  },
  actionButtonText: {
    color: tileKeeperTheme.colours.onFrame,
    fontSize: 14,
    fontWeight: '800',
  },
  actionButtonTextSecondary: {
    color: tileKeeperTheme.colours.primary,
  },
});
