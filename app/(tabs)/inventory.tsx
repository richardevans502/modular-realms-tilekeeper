import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { loadSeedCatalog } from '../../src/catalog/loadSeedCatalog';
import { ErrorBoundary } from '../../src/ui/ErrorBoundary';
import { initTileKeeperDatabase } from '../../src/db/init';
import type { InventoryRepository } from '../../src/db/inventoryRepository';
import type { CatalogRepository } from '../../src/db/catalogRepository';
import { InventoryScreen } from '../../src/inventory/InventoryScreen';
import { tileKeeperTheme } from '../../src/ui/theme';

const seedCatalog = loadSeedCatalog();

export default function InventoryRoute() {
  const [inventoryRepository, setInventoryRepository] = useState<InventoryRepository | undefined>();
  const [catalogRepository, setCatalogRepository] = useState<CatalogRepository | undefined>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void initTileKeeperDatabase().then(async (persistence) => {
      if (!mounted) return;
      // Seed catalog tiles into SQLite so inventory foreign keys resolve
      for (const tile of seedCatalog) {
        await persistence.catalogRepository.upsertTileType(tile);
      }
      setInventoryRepository(persistence.inventoryRepository);
      setCatalogRepository(persistence.catalogRepository);
      setIsReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady || !inventoryRepository || !catalogRepository) {
    return (
      <View style={styles.loadingContainer} accessibilityLabel="Loading inventory" accessibilityRole="progressbar" accessibilityState={{ busy: true }}>
        <Text style={styles.loadingText} allowFontScaling>Summoning inventory from the tile vault…</Text>
      </View>
    );
  }

  const router = useRouter();
  return (
    <ErrorBoundary onGoBack={() => router.back()}>
      <InventoryScreen
        catalog={seedCatalog}
        inventoryRepository={inventoryRepository}
        catalogRepository={catalogRepository}
      />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tileKeeperTheme.colours.background,
    padding: 24,
  },
  loadingText: {
    color: tileKeeperTheme.colours.primary,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    allowFontScaling: true,
  },
});
