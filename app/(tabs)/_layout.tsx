import { Tabs } from 'expo-router/js-tabs';

import { colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // each screen renders its own title (components/Screen)
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg2, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text3,
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="shop" options={{ title: 'Market' }} />
      <Tabs.Screen name="portfolio" options={{ title: 'Portfolio' }} />
      <Tabs.Screen name="trades" options={{ title: 'Trades' }} />
    </Tabs>
  );
}
