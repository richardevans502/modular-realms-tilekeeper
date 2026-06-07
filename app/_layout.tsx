import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { tileKeeperTheme } from '../src/ui/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.shell}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: tileKeeperTheme.colours.frame },
            headerTintColor: tileKeeperTheme.colours.onFrame,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: tileKeeperTheme.colours.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'TileKeeper' }} />
          <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
          <Stack.Screen name="layout-goal" options={{ title: 'Layout Goal' }} />
          <Stack.Screen name="preview" options={{ title: 'Preview' }} />
          <Stack.Screen name="saved-layouts" options={{ title: 'Saved Layouts' }} />
          <Stack.Screen name="export" options={{ title: 'Export & Backup' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: tileKeeperTheme.colours.background,
  },
});
