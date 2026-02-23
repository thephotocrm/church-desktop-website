import React from 'react';
import { View, Text } from 'react-native';

interface SectionHeaderProps {
  label?: string;
  title: string;
  className?: string;
}

export function SectionHeader({ label, title, className = '' }: SectionHeaderProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="font-body-bold text-xs text-accent tracking-widest uppercase mb-1">
          {label}
        </Text>
      )}
      <Text className="font-heading-bold text-xl text-foreground">{title}</Text>
    </View>
  );
}
