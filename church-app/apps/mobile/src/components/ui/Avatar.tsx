import React from 'react';
import { View, Text, Image, type ImageSourcePropType } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name?: string;
  source?: ImageSourcePropType;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-[72px] h-[72px]',
};

const textSizeClasses: Record<AvatarSize, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-3xl',
};

export function Avatar({ name, source, size = 'md', className = '' }: AvatarProps) {
  const initial = name?.[0]?.toUpperCase() ?? '?';

  if (source) {
    return (
      <Image
        source={source}
        className={`${sizeClasses[size]} rounded-full ${className}`}
      />
    );
  }

  return (
    <View
      className={`${sizeClasses[size]} rounded-full bg-primary items-center justify-center ${className}`}
    >
      <Text className={`${textSizeClasses[size]} font-heading-bold text-primary-foreground`}>
        {initial}
      </Text>
    </View>
  );
}
