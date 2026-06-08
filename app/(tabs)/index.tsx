import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { tileKeeperRoutes } from '../../src/ui/navigation';
import { tileKeeperTheme } from '../../src/ui/theme';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Modular Realms</Text>
      <Text style={styles.title}>TileKeeper</Text>
      <View style={styles.grid}>
        {tileKeeperRoutes.filter((route) => route.path !== '/').map((route) => (
          <Link key={route.path} href={route.path} style={styles.card}>
            <Text style={styles.cardIcon}>{route.icon}</Text>
            <Text style={styles.cardTitle}>{route.label}</Text>
            <Text style={styles.cardDescription}>{route.description}</Text>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, backgroundColor: tileKeeperTheme.colours.background },
  eyebrow: { color: tileKeeperTheme.colours.primary, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: tileKeeperTheme.colours.text, fontSize: 36, fontWeight: '900' },
  grid: { gap: 12, marginTop: 8 },
  card: {
    minHeight: tileKeeperTheme.touch.minimum,
    backgroundColor: tileKeeperTheme.colours.surface,
    borderColor: tileKeeperTheme.colours.border,
    borderRadius: tileKeeperTheme.radius.card,
    borderWidth: 1,
    padding: 16,
    textDecorationLine: 'none',
  },
  cardIcon: { fontSize: 24 },
  cardTitle: { color: tileKeeperTheme.colours.text, fontSize: 18, fontWeight: '800', marginTop: 4 },
  cardDescription: { color: tileKeeperTheme.colours.mutedText, fontSize: 14, lineHeight: 20, marginTop: 4 },
});
