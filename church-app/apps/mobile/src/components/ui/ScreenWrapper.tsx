import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  padded?: boolean;
}

export function ScreenWrapper({
  children,
  scroll = true,
  className = '',
  padded = true,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  if (scroll) {
    return (
      <ScrollView
        className={`flex-1 bg-background ${className}`}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 96,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className={padded ? 'px-4 pt-2' : ''}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View className={`flex-1 bg-background ${padded ? 'px-4 pt-2' : ''} ${className}`}>
      {children}
    </View>
  );
}
