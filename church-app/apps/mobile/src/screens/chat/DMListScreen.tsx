import React from 'react';
import { MessageCircle } from 'lucide-react-native';
import { ScreenWrapper, EmptyState } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

export function DMListScreen({ navigation }: any) {
  const { colors } = useTheme();

  // TODO: Phase 3 - list DM conversations
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<MessageCircle size={48} color={colors.mutedForeground} />}
        title="Messages"
        subtitle="Direct messages coming in a future update"
      />
    </ScreenWrapper>
  );
}
