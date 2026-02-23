import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { PendingScreen } from '../screens/auth/PendingScreen';
import { LoadingSpinner } from '../components/ui';
import { useTheme } from '../lib/useTheme';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const { isDark, colors } = useTheme();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.card,
          text: colors.foreground,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'OpenSans_400Regular', fontWeight: '400' as const },
          medium: { fontFamily: 'OpenSans_600SemiBold', fontWeight: '600' as const },
          bold: { fontFamily: 'OpenSans_700Bold', fontWeight: '700' as const },
          heavy: { fontFamily: 'OpenSans_700Bold', fontWeight: '700' as const },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user?.status === 'pending' ? (
          <Stack.Screen name="Pending" component={PendingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="AuthModal" component={AuthStack} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
