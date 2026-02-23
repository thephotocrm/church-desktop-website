import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Heart, MapPin, Mail, ChevronDown, Check, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../../lib/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { AuthRequiredScreen } from '../auth/AuthRequiredScreen';

const GIVE_URL = 'https://fpcd.life/give';
const PRESETS = ['10', '25', '50', '100', '250', '500'];
const FUNDS = ['General Fund', 'Missions', 'Building Fund', 'Youth Ministry'];
const FREQUENCIES = [
  { label: 'Weekly', note: 'Every Sunday' },
  { label: 'Bi-Weekly', note: 'Every other Sunday' },
  { label: 'Monthly', note: '1st of each month' },
  { label: 'One Time', note: 'Single gift' },
];

// ── Palette ──────────────────────────────────────────────────────
const INK = '#1A1714';
const INK2 = '#231E1A';
const GOLD = '#C9943A';
const GOLD_LIGHT = '#E8B860';
const GOLD_DIM = 'rgba(201,148,58,0.18)';
const WARM_GRAY = '#8C8078';
const BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.35)';
const MUTED2 = 'rgba(255,255,255,0.08)';

export function GivingScreen() {
  const { colors } = useTheme();
  const { token, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('50');
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [fund, setFund] = useState('General Fund');
  const [frequency, setFrequency] = useState('Weekly');
  const [loading, setLoading] = useState(false);
  const [showFundPicker, setShowFundPicker] = useState(false);
  const [showMailAddress, setShowMailAddress] = useState(false);

  if (!isAuthenticated) return <AuthRequiredScreen featureName="Giving" />;

  const activeAmount = isCustom ? customAmount : amount;
  const displayAmount = activeAmount
    ? parseInt(activeAmount || '0').toLocaleString()
    : '0';

  async function handleGive() {
    if (!activeAmount || parseFloat(activeAmount) <= 0) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ amount: activeAmount, fund });
      if (frequency !== 'One Time') {
        params.set('type', 'recurring');
        const freqMap: Record<string, string> = {
          Weekly: 'weekly',
          'Bi-Weekly': 'weekly',
          Monthly: 'monthly',
        };
        params.set('frequency', freqMap[frequency] || 'monthly');
      }
      // Try to get auth code so the website can log the member in automatically
      try {
        const { code } = await api.getAuthCode(token!);
        params.set('code', code);
      } catch {
        // Auth code endpoint may not exist yet — continue without it
      }
      await WebBrowser.openBrowserAsync(`${GIVE_URL}?${params.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  function selectPreset(value: string) {
    setIsCustom(false);
    setAmount(value);
  }

  function activateCustom() {
    setIsCustom(true);
    setAmount('');
  }

  const activePreset = isCustom ? 'Other' : `$${amount}`;
  const activeFreqNote =
    FREQUENCIES.find((f) => f.label === frequency)?.note ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: INK }}>
      {/* ── Ambient glow overlays ── */}
      {/* Gold glow — large, soft, no hard edge */}
      <View
        style={{
          position: 'absolute',
          top: -200,
          alignSelf: 'center',
          width: 600,
          height: 600,
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(201,148,58,0.18)',
            'rgba(201,148,58,0.10)',
            'rgba(201,148,58,0.04)',
            'rgba(201,148,58,0.0)',
          ]}
          locations={[0, 0.3, 0.55, 1]}
          style={{ flex: 1, borderRadius: 300 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>
      {/* Terracotta glow — bottom right accent */}
      <View
        style={{
          position: 'absolute',
          bottom: -40,
          right: -120,
          width: 420,
          height: 420,
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(192,92,58,0.10)',
            'rgba(192,92,58,0.04)',
            'rgba(192,92,58,0.0)',
          ]}
          locations={[0, 0.4, 1]}
          style={{ flex: 1, borderRadius: 210 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top + 14,
          }}
        >
          <Text
            style={{
              fontFamily: 'OpenSans_700Bold',
              fontSize: 10,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: GOLD,
            }}
          >
            FPC Dallas
          </Text>
          <Text
            style={{
              fontFamily: 'PlayfairDisplay_700Bold',
              fontSize: 18,
              color: '#fff',
              letterSpacing: -0.3,
              marginTop: 1,
            }}
          >
            Give
          </Text>
        </View>

        {/* ── Amount Stage ── */}
        <View style={{ paddingTop: 40, paddingBottom: 32, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'OpenSans_600SemiBold',
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: MUTED,
              marginBottom: 12,
            }}
          >
            Your Gift
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_400Regular',
                fontSize: 30,
                color: GOLD,
                marginTop: 14,
                marginRight: 4,
              }}
            >
              $
            </Text>
            {isCustom ? (
              <TextInput
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.2)"
                autoFocus
                style={{
                  fontFamily: 'PlayfairDisplay_700Bold',
                  fontSize: 80,
                  color: '#fff',
                  letterSpacing: -4,
                  textAlign: 'center',
                  minWidth: 120,
                  padding: 0,
                  lineHeight: 88,
                }}
              />
            ) : (
              <Text
                style={{
                  fontFamily: 'PlayfairDisplay_700Bold',
                  fontSize: 80,
                  color: '#fff',
                  letterSpacing: -4,
                  lineHeight: 88,
                }}
              >
                {displayAmount}
              </Text>
            )}
            <Text
              style={{
                fontFamily: 'PlayfairDisplay_400Regular',
                fontSize: 30,
                color: MUTED,
                marginTop: 14,
              }}
            >
              .00
            </Text>
          </View>
        </View>

        {/* ── Preset Scroll ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {PRESETS.map((value) => {
            const label = `$${value}`;
            const isActive = activePreset === label;
            return (
              <Pressable
                key={value}
                onPress={() => selectPreset(value)}
                className="active:opacity-80"
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 100,
                  borderWidth: 1.5,
                  borderColor: isActive ? GOLD : BORDER,
                  backgroundColor: isActive ? GOLD : MUTED2,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'OpenSans_600SemiBold',
                    fontSize: 15,
                    color: isActive ? INK : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={activateCustom}
            className="active:opacity-80"
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 100,
              borderWidth: 1.5,
              borderColor: isCustom ? GOLD : BORDER,
              backgroundColor: isCustom ? GOLD : MUTED2,
            }}
          >
            <Text
              style={{
                fontFamily: 'OpenSans_600SemiBold',
                fontSize: 15,
                color: isCustom ? INK : 'rgba(255,255,255,0.55)',
              }}
            >
              Other
            </Text>
          </Pressable>
        </ScrollView>

        {/* ── Divider ── */}
        <View
          style={{
            height: 1,
            backgroundColor: BORDER,
            marginHorizontal: 24,
            marginVertical: 28,
          }}
        />

        {/* ── Settings Panel ── */}
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {/* Fund row */}
          <Pressable
            onPress={() => setShowFundPicker(true)}
            className="active:opacity-80"
            style={{
              backgroundColor: INK2,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: 'OpenSans_700Bold',
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: WARM_GRAY,
                }}
              >
                Fund
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: GOLD_DIM,
                borderWidth: 1.5,
                borderColor: 'rgba(201,148,58,0.3)',
                borderRadius: 100,
                paddingVertical: 8,
                paddingLeft: 16,
                paddingRight: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: 'OpenSans_700Bold',
                  fontSize: 13,
                  color: GOLD_LIGHT,
                  marginRight: 6,
                }}
              >
                {fund}
              </Text>
              <ChevronDown size={11} color={GOLD} />
            </View>
          </Pressable>

          {/* Frequency row */}
          <View
            style={{
              backgroundColor: INK2,
              borderWidth: 1,
              borderColor: BORDER,
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 18,
            }}
          >
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontFamily: 'OpenSans_700Bold',
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: WARM_GRAY,
                }}
              >
                Frequency
              </Text>
              <Text
                style={{
                  fontFamily: 'OpenSans_600SemiBold',
                  fontSize: 16,
                  color: '#fff',
                  marginTop: 2,
                }}
              >
                {activeFreqNote}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {FREQUENCIES.map((f) => {
                const isActive = frequency === f.label;
                return (
                  <Pressable
                    key={f.label}
                    onPress={() => setFrequency(f.label)}
                    className="active:opacity-80"
                    style={{
                      paddingVertical: 7,
                      paddingHorizontal: 13,
                      borderRadius: 100,
                      borderWidth: 1.5,
                      borderColor: isActive ? '#fff' : BORDER,
                      backgroundColor: isActive ? '#fff' : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'OpenSans_600SemiBold',
                        fontSize: 12,
                        color: isActive ? INK : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── CTA Button ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Pressable
            onPress={handleGive}
            disabled={loading || !activeAmount || parseFloat(activeAmount || '0') <= 0}
            className="active:opacity-90"
            style={{
              opacity:
                loading || !activeAmount || parseFloat(activeAmount || '0') <= 0
                  ? 0.5
                  : 1,
            }}
          >
            <LinearGradient
              colors={['#D4A04A', '#A8741F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 22,
                paddingVertical: 20,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                shadowColor: '#A8741F',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 32,
                elevation: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color={INK} style={{ marginRight: 10 }} />
              ) : (
                <Heart size={18} color={INK} fill={INK} style={{ marginRight: 10 }} />
              )}
              <Text
                style={{
                  fontFamily: 'OpenSans_700Bold',
                  fontSize: 17,
                  color: INK,
                  letterSpacing: 0.2,
                }}
              >
                {loading ? 'Opening...' : `Give $${displayAmount}.00`}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Footnotes */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              paddingHorizontal: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Lock size={11} color="rgba(255,255,255,0.3)" />
              <Text
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Encrypted & secure
              </Text>
            </View>
            {frequency === 'One Time' && (
              <Pressable onPress={() => setShowMailAddress(true)}>
                <Text
                  style={{
                    fontFamily: 'OpenSans_600SemiBold',
                    fontSize: 11.5,
                    color: GOLD,
                  }}
                >
                  Mail a donation →
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Fund Picker Modal ── */}
      <Modal
        visible={showFundPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFundPicker(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
          onPress={() => setShowFundPicker(false)}
        >
          <View
            style={{
              backgroundColor: INK2,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: BORDER,
              paddingVertical: 8,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 24,
                },
                android: { elevation: 8 },
              }),
            }}
          >
            <Text
              style={{
                fontFamily: 'OpenSans_700Bold',
                fontSize: 11,
                color: GOLD,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              Select Fund
            </Text>
            {FUNDS.map((f) => (
              <Pressable
                key={f}
                onPress={() => {
                  setFund(f);
                  setShowFundPicker(false);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent',
                })}
              >
                <Text
                  style={{
                    fontFamily:
                      fund === f ? 'OpenSans_600SemiBold' : 'OpenSans_400Regular',
                    fontSize: 16,
                    color: fund === f ? '#fff' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {f}
                </Text>
                {fund === f && <Check size={18} color={GOLD} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Mail Address Modal ── */}
      <Modal
        visible={showMailAddress}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMailAddress(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
          onPress={() => setShowMailAddress(false)}
        >
          <View
            style={{
              backgroundColor: INK2,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: BORDER,
              padding: 24,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 24,
                },
                android: { elevation: 8 },
              }),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Mail size={18} color={GOLD} />
              <Text
                style={{
                  fontFamily: 'OpenSans_700Bold',
                  fontSize: 16,
                  color: '#fff',
                  marginLeft: 8,
                }}
              >
                Mail a Donation
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MapPin size={16} color={WARM_GRAY} style={{ marginTop: 2 }} />
              <Text
                style={{
                  fontFamily: 'OpenSans_400Regular',
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 24,
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                First Pentecostal Church of Dallas{'\n'}
                110 Security Ct{'\n'}
                Wylie, TX 75098
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
