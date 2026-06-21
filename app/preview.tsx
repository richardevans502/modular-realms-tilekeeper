import { useEffect, useState } from 'react';
import { router, useLocalSearchParams, useRouter } from 'expo-router';

import { loadSeedCatalog } from '../src/catalog/loadSeedCatalog';
import { initTileKeeperDatabase } from '../src/db/init';
import type { SavedLayoutRepository } from '../src/db/savedLayoutRepository';
import { getCachedSolvedLayout } from '../src/hooks/useLayoutSolver';
import { buildDemoLayout, LayoutPreviewScreen } from '../src/preview/LayoutPreviewScreen';
import type { SaveLayoutFormData } from '../src/preview/SaveLayoutModal';
import { ErrorBoundary } from '../src/ui/ErrorBoundary';

const catalog = loadSeedCatalog();

export default function PreviewRoute() {
  const { layoutId } = useLocalSearchParams<{ layoutId?: string }>();
  const generatedLayout = getCachedSolvedLayout(layoutId);
  const layout = generatedLayout ?? buildDemoLayout(catalog);

  const [repository, setRepository] = useState<SavedLayoutRepository | null>(null);

  useEffect(() => {
    let mounted = true;
    void initTileKeeperDatabase().then((persistence) => {
      if (mounted) {
        setRepository(persistence.savedLayoutRepository);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSaveLayout(data: SaveLayoutFormData): Promise<void> {
    if (!repository) {
      throw new Error('Database not ready');
    }
    const savedLayout = {
      id: `saved-${layout.id}-${Date.now()}`,
      name: data.name,
      layout,
      tags: data.tags,
      favourite: data.favourite,
      notes: data.notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await repository.createLayout(savedLayout);
  }

  const expoRouter = useRouter();
  return (
    <ErrorBoundary onGoBack={() => expoRouter.back()}>
      <LayoutPreviewScreen
        layout={layout}
        catalog={catalog}
        onBackToLayoutGoal={() => router.push('/layout-goal')}
        onSaveLayout={repository ? handleSaveLayout : undefined}
      />
    </ErrorBoundary>
  );
}
