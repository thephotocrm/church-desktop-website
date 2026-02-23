import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation<any>();

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (isAuthenticated) {
        callback();
      } else {
        navigation.navigate('AuthModal');
      }
    },
    [isAuthenticated, navigation]
  );

  return requireAuth;
}
