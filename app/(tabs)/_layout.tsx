import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import { ArchwayIcon, ChestIcon, FloorTileIcon, KeepIcon, TorchIcon } from '../../src/ui/DungeonTileIcons';
import { tileKeeperTheme } from '../../src/ui/theme';

export default function TabLayout() {
  const theme = tileKeeperTheme;
  const styles = createStyles(theme);

  return (
    <View style={styles.shell}>
      <Tabs
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: theme.colours.frame, borderBottomColor: theme.colours.border, borderBottomWidth: 1 },
          headerTintColor: theme.colours.onFrame,
          headerTitleStyle: { fontWeight: '800' as const },
          tabBarStyle: {
            backgroundColor: theme.colours.frame,
            borderTopColor: theme.colours.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: theme.colours.primary,
          tabBarInactiveTintColor: theme.colours.mutedText,
          tabBarLabelStyle: { fontWeight: '800' as const, fontSize: 11 },
          tabBarIcon: ({ focused }) => {
            switch (route.name) {
              case 'index':
                return <KeepIcon size={22} colour={theme.colours.primary} focused={focused} />;
              case 'inventory':
                return <FloorTileIcon size={22} colour={theme.colours.primary} focused={focused} />;
              case 'layout-goal':
                return <ArchwayIcon size={22} colour={theme.colours.primary} focused={focused} />;
              case 'saved-layouts':
                return <ChestIcon size={22} colour={theme.colours.primary} focused={focused} />;
              case 'settings':
                return <TorchIcon size={22} colour={theme.colours.primary} focused={focused} />;
              default:
                return <FloorTileIcon size={22} colour={theme.colours.primary} focused={focused} />;
            }
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'TileKeeper',
            tabBarLabel: 'Keep',
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Inventory',
            tabBarLabel: 'Vault',
          }}
        />
        <Tabs.Screen
          name="layout-goal"
          options={{
            title: 'Generate Layout',
            tabBarLabel: 'Forge',
          }}
        />
        <Tabs.Screen
          name="saved-layouts"
          options={{
            title: 'Saved Layouts',
            tabBarLabel: 'Hoard',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Torch',
          }}
        />
      </Tabs>
    </View>
  );
}

const createStyles = (theme: typeof tileKeeperTheme) => StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colours.background,
  },
});
