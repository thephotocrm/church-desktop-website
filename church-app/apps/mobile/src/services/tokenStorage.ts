import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// SecureStore is not available on web — fall back to a simple in-memory store
let memoryToken: string | null = null;
let memoryRefreshToken: string | null = null;

export const tokenStorage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') return memoryToken;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryToken = token;
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async remove(): Promise<void> {
    if (Platform.OS === 'web') {
      memoryToken = null;
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async getRefresh(): Promise<string | null> {
    if (Platform.OS === 'web') return memoryRefreshToken;
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setRefresh(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryRefreshToken = token;
      return;
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async removeRefresh(): Promise<void> {
    if (Platform.OS === 'web') {
      memoryRefreshToken = null;
      return;
    }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
