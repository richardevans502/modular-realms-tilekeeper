import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TileKeeper</Text>
      <Text style={styles.subtitle}>Foundation build: all systems cute.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#fbbf24',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#e2e8f0',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
