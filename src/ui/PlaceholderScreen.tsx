import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { getRouteById, type TileKeeperRouteId } from './navigation';
import { tileKeeperTheme } from './theme';

interface PlaceholderScreenProps {
  routeId: Exclude<TileKeeperRouteId, 'home'>;
}

export function PlaceholderScreen({ routeId }: PlaceholderScreenProps) {
  const route = getRouteById(routeId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>{route.icon}</Text>
      <Text style={styles.title}>{route.label}</Text>
      <Text style={styles.description}>{route.description}</Text>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Shell status</Text>
        <Text style={styles.panelBody}>
          This screen is wired into Expo Router with the Modular Realms parchment, oxblood, brass, and charcoal theme.
          Feature-specific controls can now be mounted here without replacing navigation.
        </Text>
      </View>
      <Link href="/" style={styles.backLink}>Back to TileKeeper home</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, backgroundColor: tileKeeperTheme.colours.background, flexGrow: 1 },
  icon: { fontSize: 40 },
  title: { color: tileKeeperTheme.colours.text, fontSize: 30, fontWeight: '900' },
  description: { color: tileKeeperTheme.colours.mutedText, fontSize: 16, lineHeight: 24 },
  panel: { backgroundColor: tileKeeperTheme.colours.surface, borderColor: tileKeeperTheme.colours.border, borderRadius: tileKeeperTheme.radius.card, borderWidth: 1, padding: 16 },
  panelTitle: { color: tileKeeperTheme.colours.primary, fontSize: 18, fontWeight: '800' },
  panelBody: { color: tileKeeperTheme.colours.text, fontSize: 15, lineHeight: 22, marginTop: 8 },
  backLink: { color: tileKeeperTheme.colours.primary, fontWeight: '800', minHeight: tileKeeperTheme.touch.minimum, paddingTop: 12 },
});
