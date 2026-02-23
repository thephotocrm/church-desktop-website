import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Clock, UtensilsCrossed, BookOpen, Heart } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/ui';
import { useTheme } from '../../lib/useTheme';

function InfoCard({
  icon,
  title,
  description,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'OpenSans_700Bold',
            fontSize: 15,
            color: colors.foreground,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: 'OpenSans_400Regular',
            fontSize: 13,
            color: colors.mutedForeground,
            lineHeight: 19,
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

export function ConnectScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.primary + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Users size={36} color={colors.primary} />
          </View>
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 26,
              color: colors.foreground,
              textAlign: 'center',
            }}
          >
            Connect Nights
          </Text>
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 14,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: 6,
              paddingHorizontal: 20,
              lineHeight: 20,
            }}
          >
            Join us every Sunday evening for a time of food, Bible study, and fellowship with your church family.
          </Text>
        </View>

        {/* Schedule banner */}
        <View
          style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clock size={20} color="#fff" />
          <Text
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 16,
              color: '#fff',
              marginLeft: 10,
            }}
          >
            Sundays at 6:00 PM
          </Text>
        </View>

        {/* What to expect */}
        <Text
          style={{
            fontFamily: 'OpenSans_700Bold',
            fontSize: 16,
            color: colors.foreground,
            marginBottom: 12,
          }}
        >
          What to Expect
        </Text>

        <InfoCard
          icon={<UtensilsCrossed size={22} color={colors.primary} />}
          title="A Shared Meal"
          description="We start the evening with a home-cooked meal. Come hungry and enjoy a time of good food around the table."
          colors={colors}
        />
        <InfoCard
          icon={<BookOpen size={22} color={colors.primary} />}
          title="Bible Study"
          description="Dig deeper into God's Word together in a relaxed, discussion-based setting — everyone is welcome to participate."
          colors={colors}
        />
        <InfoCard
          icon={<Heart size={22} color={colors.primary} />}
          title="Fellowship"
          description="Build meaningful relationships with others in our church family. Connect Nights are a great place to find community."
          colors={colors}
        />

        {/* Welcoming message */}
        <View
          style={{
            marginTop: 8,
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 18,
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Everyone is Welcome
          </Text>
          <Text
            style={{
              fontFamily: 'OpenSans_400Regular',
              fontSize: 13,
              color: colors.mutedForeground,
              textAlign: 'center',
              lineHeight: 19,
            }}
          >
            Whether you've been attending for years or this is your first time, you'll find a warm seat and a friendly face. We'd love to see you this Sunday!
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
