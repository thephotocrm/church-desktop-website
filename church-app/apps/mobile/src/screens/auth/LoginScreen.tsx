import React, { useState } from 'react';
import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';

export function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-background px-6 justify-center">
        <Text className="font-heading-bold text-3xl text-foreground text-center mb-2">
          Welcome Back
        </Text>
        <Text className="font-body text-base text-muted-foreground text-center mb-10">
          Sign in to your FPCD account
        </Text>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button onPress={handleLogin} loading={loading} className="mt-2">
          Sign In
        </Button>

        <Pressable onPress={() => navigation.navigate('Register')} className="mt-6">
          <Text className="font-body text-sm text-accent text-center">
            Don't have an account? Register
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
