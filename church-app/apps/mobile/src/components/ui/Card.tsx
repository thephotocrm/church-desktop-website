import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', onPress }: CardProps) {
  const content = (
    <View className={`bg-card rounded-2xl border border-border p-4 ${className}`}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {content}
      </Pressable>
    );
  }

  return content;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <View className={`mb-3 ${className}`}>{children}</View>;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <Text className={`font-body-bold text-lg text-foreground ${className}`}>
      {children}
    </Text>
  );
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  return (
    <Text className={`font-body text-sm text-muted-foreground ${className}`}>
      {children}
    </Text>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <View className={className}>{children}</View>;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <View className={`mt-3 flex-row items-center ${className}`}>{children}</View>
  );
}
