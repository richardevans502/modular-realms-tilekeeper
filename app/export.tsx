import { useEffect, useState } from 'react';

import { initTileKeeperDatabase } from '../src/db/init';
import type { CatalogRepository } from '../src/db/catalogRepository';
import type { InventoryRepository } from '../src/db/inventoryRepository';
import type { SavedLayoutRepository } from '../src/db/savedLayoutRepository';
import { ExportScreen } from '../src/export/ExportScreen';

export default function ExportRoute() {
  const [catalogRepository, setCatalogRepository] = useState<CatalogRepository | undefined>();
  const [inventoryRepository, setInventoryRepository] = useState<InventoryRepository | undefined>();
  const [savedLayoutRepository, setSavedLayoutRepository] = useState<Pick<SavedLayoutRepository, 'listLayouts' | 'deleteLayout' | 'upsertLayout'> | undefined>();

  useEffect(() => {
    let mounted = true;
    void initTileKeeperDatabase().then((persistence) => {
      if (mounted) {
        setCatalogRepository(persistence.catalogRepository);
        setInventoryRepository(persistence.inventoryRepository);
        setSavedLayoutRepository(persistence.savedLayoutRepository);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ExportScreen
      catalogRepository={catalogRepository}
      inventoryRepository={inventoryRepository}
      savedLayoutRepository={savedLayoutRepository}
    />
  );
}
