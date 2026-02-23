import React from 'react';
import { View, Text } from 'react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  header?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, header, title, subtitle, className = '', action }: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center px-8 ${className}`}>
      {header}
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="font-heading-bold text-xl text-foreground text-center mb-2">
        {title}
      </Text>
      {subtitle && (
        <Text className="font-body text-base text-muted-foreground text-center">
          {subtitle}
        </Text>
      )}
      {action && <View className="mt-6">{action}</View>}
    </View>
  );
}
