import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrate } from '@/db/schema';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="dtg.db" onInit={migrate}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'DTG simple' }} />
        <Stack.Screen name="project/[id]" options={{ title: 'Copropriété' }} />
        <Stack.Screen name="level/[id]" options={{ title: 'Plan' }} />
      </Stack>
    </SQLiteProvider>
  );
}
