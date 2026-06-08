import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { tileKeeperTheme } from '../src/ui/theme';

// Keep splash visible until we finish mounting
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.shell}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: tileKeeperTheme.colours.frame },
            headerTintColor: tileKeeperTheme.colours.onFrame,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: tileKeeperTheme.colours.background },
            animation: 'slide_from_right',
            animationDuration: 200,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="export"
            options={{
              title: 'Export & Backup',
              presentation: 'modal',
              animation: 'fade_from_bottom',
              animationDuration: 250,
            }}
          />

          <Stack.Screen
            name="preview"
            options={{
              title: 'Layout Preview',
              presentation: 'card',
              animation: 'slide_from_bottom',
              animationDuration: 250,
            }}
          />
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
