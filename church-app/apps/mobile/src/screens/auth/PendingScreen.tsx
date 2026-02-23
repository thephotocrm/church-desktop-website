import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

export function PendingScreen() {
  const { logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const [checking, setChecking] = useState(false);

  // Poll every 15 seconds to see if admin approved
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleCheckStatus() {
    setChecking(true);
    await refreshUser();
    setChecking(false);
  }

  return (
    <View className="flex-1 bg-background px-8 items-center justify-center">
      <View className="w-20 h-20 rounded-full bg-accent/20 items-center justify-center mb-6">
        <Clock size={40} color={colors.accent} />
      </View>
      <Text className="font-heading-bold text-2xl text-foreground text-center mb-3">
        Awaiting Approval
      </Text>
      <Text className="font-body text-base text-muted-foreground text-center leading-6 mb-10">
        Your account has been created. An admin will review and approve your access shortly.
      </Text>
      <View style={{ gap: 12, alignItems: 'center' }}>
        <Button onPress={handleCheckStatus} disabled={checking}>
          {checking ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={colors.accentForeground} />
              <Text style={{ fontFamily: 'OpenSans_600SemiBold', color: colors.accentForeground }}>
                Checking...
              </Text>
            </View>
          ) : (
            'Check Status'
          )}
        </Button>
        <Button variant="outline" onPress={logout}>
          Sign Out
        </Button>
      </View>
    </View>
  );
}
