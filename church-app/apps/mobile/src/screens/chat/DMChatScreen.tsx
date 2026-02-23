import React from 'react';
import { Send } from 'lucide-react-native';
import { ScreenWrapper, EmptyState } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

export function DMChatScreen({ route }: any) {
  const { colors } = useTheme();

  // TODO: Phase 3 - DM conversation view
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Send size={48} color={colors.mutedForeground} />}
        title="Chat"
        subtitle="Direct messaging coming in a future update"
      />
    </ScreenWrapper>
  );
}
