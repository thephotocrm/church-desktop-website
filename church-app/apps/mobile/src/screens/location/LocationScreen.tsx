import React from 'react';
import { MapPin } from 'lucide-react-native';
import { ScreenWrapper, EmptyState } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

export function LocationScreen() {
  const { colors } = useTheme();

  return (
    <ScreenWrapper>
      <EmptyState
        icon={<MapPin size={48} color={colors.mutedForeground} />}
        title="Our Location"
        subtitle="Map and directions coming in a future update"
      />
    </ScreenWrapper>
  );
}
