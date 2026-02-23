import React from 'react';
import { Pressable } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { useTheme } from '../lib/useTheme';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: 'OpenSans_600SemiBold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={({ navigation }) => ({
          title: 'Sign In',
          headerLeft: () => (
            <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={8}>
              <X size={24} color={colors.foreground} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
    </Stack.Navigator>
  );
}
