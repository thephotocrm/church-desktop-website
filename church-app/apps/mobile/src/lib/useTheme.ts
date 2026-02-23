import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    colorScheme: colorScheme ?? 'light',
    isDark,
    colors: {
      primary: isDark ? '#243566' : '#1b294b',
      primaryForeground: '#f8fafc',
      accent: isDark ? '#f5a623' : '#d4920a',
      accentForeground: '#0f1729',
      background: isDark ? '#0a0f1d' : '#f6f7f9',
      card: isDark ? '#111827' : '#ffffff',
      foreground: isDark ? '#f8fafc' : '#0f1729',
      muted: isDark ? '#1e2a3f' : '#e2e4e9',
      mutedForeground: isDark ? '#94a3b8' : '#6b7280',
      border: isDark ? '#1e3a5f' : '#e5e7eb',
      destructive: isDark ? '#b91c1c' : '#c51111',
    },
  } as const;
}
