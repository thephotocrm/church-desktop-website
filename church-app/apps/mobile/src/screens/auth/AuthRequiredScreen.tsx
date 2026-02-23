import React from 'react';
import { Text } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper, EmptyState, Button } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

interface AuthRequiredScreenProps {
  featureName?: string;
}

export function AuthRequiredScreen({ featureName }: AuthRequiredScreenProps) {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  return (
    <ScreenWrapper scroll={false}>
      <EmptyState
        icon={<Lock size={48} color={colors.mutedForeground} />}
        title="Sign In Required"
        subtitle={`Sign in to access ${featureName ?? 'this feature'}.`}
        header={featureName ? (
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 24,
              color: colors.foreground,
              marginBottom: 16,
            }}
          >
            {featureName}
          </Text>
        ) : undefined}
        action={
          <Button onPress={() => navigation.navigate('AuthModal')}>
            Sign In
          </Button>
        }
      />
    </ScreenWrapper>
  );
}
