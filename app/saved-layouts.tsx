import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { initTileKeeperDatabase } from '../src/db/init';
import type { SavedLayoutRepository } from '../src/db/savedLayoutRepository';
import { SavedLayoutsScreen } from '../src/layoutLibrary/SavedLayoutsScreen';

export default function SavedLayoutsRoute() {
  const router = useRouter();
  const [repository, setRepository] = useState<SavedLayoutRepository | undefined>();

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

  return (
    <SavedLayoutsScreen
      repository={repository}
      onPreviewLayout={(layoutId) => router.push({ pathname: '/preview', params: { layoutId } })}
    />
  );
}
