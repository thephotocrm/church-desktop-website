import React from 'react';
import { Play } from 'lucide-react-native';
import { ScreenWrapper, EmptyState } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

export function SermonDetailScreen({ route }: any) {
  const { colors } = useTheme();

  // TODO: Phase 1 - display sermon details, audio/video player
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Play size={48} color={colors.mutedForeground} />}
        title="Sermon Details"
        subtitle="Sermon detail and player coming soon"
      />
    </ScreenWrapper>
  );
}
