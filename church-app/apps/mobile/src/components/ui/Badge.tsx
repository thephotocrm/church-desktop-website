import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'accent' | 'outline' | 'destructive';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary',
  accent: 'bg-accent',
  outline: 'bg-transparent border border-border',
  destructive: 'bg-destructive',
};

const variantTextClasses: Record<BadgeVariant, string> = {
  default: 'text-primary-foreground',
  accent: 'text-accent-foreground',
  outline: 'text-foreground',
  destructive: 'text-white',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${variantClasses[variant]} ${className}`}>
      <Text className={`font-body-bold text-xs ${variantTextClasses[variant]}`}>
        {children}
      </Text>
    </View>
  );
}
