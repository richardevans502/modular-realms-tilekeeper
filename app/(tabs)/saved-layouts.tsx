import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { initTileKeeperDatabase } from '../../src/db/init';
import type { SavedLayoutRepository } from '../../src/db/savedLayoutRepository';
import { SavedLayoutsScreen } from '../../src/layoutLibrary/SavedLayoutsScreen';

export default function SavedLayoutsRoute() {
  const router = useRouter();
  const [repository, setRepository] = useState<SavedLayoutRepository | undefined>();
  const [reloadTrigger, setReloadTrigger] = useState(0);

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

  useFocusEffect(
    useCallback(() => {
      setReloadTrigger((t) => t + 1);
    }, [])
  );

  return (
    <SavedLayoutsScreen
      repository={repository}
      reloadTrigger={reloadTrigger}
      onPreviewLayout={(layoutId) => router.push({ pathname: '/preview', params: { layoutId } })}
    />
  );
}
