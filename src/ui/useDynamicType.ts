import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { tileKeeperTheme } from './theme';

export function useDynamicType() {
  const { fontScale } = useWindowDimensions();
  // Clamp to reasonable bounds to prevent layout explosion
  const clampedScale = Math.min(Math.max(fontScale, 0.8), 2.0);

  const scaled = useMemo(() => {
    function applyScale(value: number): number {
      return Math.round(value * clampedScale);
    }

    // Scaled typography tokens
    const typography = {
      title: { ...tileKeeperTheme.typography.title, fontSize: applyScale(tileKeeperTheme.typography.title.fontSize) },
      sectionHeader: { ...tileKeeperTheme.typography.sectionHeader, fontSize: applyScale(tileKeeperTheme.typography.sectionHeader.fontSize) },
      body: { ...tileKeeperTheme.typography.body, fontSize: applyScale(tileKeeperTheme.typography.body.fontSize) },
      label: { ...tileKeeperTheme.typography.label, fontSize: applyScale(tileKeeperTheme.typography.label.fontSize) },
      data: { ...tileKeeperTheme.typography.data, fontSize: applyScale(tileKeeperTheme.typography.data.fontSize) },
    };

    // Scaled touch targets
    const touch = {
      minimum: applyScale(tileKeeperTheme.touch.minimum),
      preferredButtonHeight: applyScale(tileKeeperTheme.touch.preferredButtonHeight),
    };

    return { fontScale: clampedScale, applyScale, typography, touch };
  }, [clampedScale]);

  return scaled;
}
