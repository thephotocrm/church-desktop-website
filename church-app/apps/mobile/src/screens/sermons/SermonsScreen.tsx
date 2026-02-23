import React from 'react';
import { BookOpen } from 'lucide-react-native';
import { ScreenWrapper, EmptyState } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

export function SermonsScreen({ navigation }: any) {
  const { colors } = useTheme();

  // TODO: Phase 1 - fetch sermons from API
  return (
    <ScreenWrapper>
      <EmptyState
        icon={<BookOpen size={48} color={colors.mutedForeground} />}
        title="Sermons"
        subtitle="Sermons will appear here once available"
      />
    </ScreenWrapper>
  );
}
