import React from 'react';
import { Bell } from 'lucide-react-native';
import { ScreenWrapper, EmptyState } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

export function AnnouncementsScreen() {
  const { colors } = useTheme();

  // TODO: Phase 1 - fetch and display announcements
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<Bell size={48} color={colors.mutedForeground} />}
        title="Announcements"
        subtitle="Announcements will appear here once available"
      />
    </ScreenWrapper>
  );
}
