import { Link } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    Platform,
    Pressable,
    Text,
    TextInput,
    View
} from 'react-native';

// £1 per review — keep in sync with api/create-checkout-session.js
const COST_PER_REVIEW_PENCE = 100;
const PRESETS = [5, 10, 25, 50];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 999;

function reviewsFor(pounds: number) {
  return Math.floor((pounds * 100) / COST_PER_REVIEW_PENCE);
}

function fmt(n: number) {
  return n.toLocaleString('en-GB');
}

// ── Animated number that pops on change ──────────────────────────────────────

function AnimatedCount({ value }: { value: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    prev.current = value;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.75, duration: 60, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(scale, { toValue: 1.12, duration: 140, easing: Easing.out(Easing.back(4)), useNativeDriver: false }),
      Animated.timing(scale, { toValue: 1, duration: 90, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [value, scale]);

  return (
    <Animated.Text
      style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: 44,
        color: '#3b82f6',
        textAlign: 'center',
        transform: [{ scale }],
      }}>
      {fmt(value)}
    </Animated.Text>
  );
}

// ── Pill button ──────────────────────────────────────────────────────────────

function Pill({ amount, active, onPress }: { amount: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 99,
        borderWidth: 1.5,
        borderColor: active ? '#3b82f6' : '#e5e5e5',
        backgroundColor: active ? '#eff6ff' : pressed ? '#fafaf8' : '#fff',
        ...(Platform.OS === 'web' ? ({ transition: 'all .15s ease' } as any) : {}),
      })}>
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          fontWeight: active ? '500' : '400',
          color: active ? '#3b82f6' : '#666',
        }}>
        £{amount}
      </Text>
    </Pressable>
  );
}

// ── Main fund card (used in modal) ───────────────────────────────────────────

interface FundReviewsModalProps {
  category: 'regulations' | 'ngos' | 'civil-service';
  visible: boolean;
  onClose: () => void;
}

export function FundReviewsModal({ category, visible, onClose }: FundReviewsModalProps) {
  const [amount, setAmount] = useState(10);
  const [customText, setCustomText] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Backdrop fade
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(cardScale, { toValue: 1, duration: 250, easing: Easing.out(Easing.back(1.5)), useNativeDriver: false }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      backdropOpacity.setValue(0);
      cardScale.setValue(0.95);
      cardOpacity.setValue(0);
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity]);

  const reviews = reviewsFor(amount);
  const label =
    category === 'ngos' ? 'charities' : category === 'civil-service' ? 'gov bodies' : 'regulations';

  const pickPreset = useCallback((v: number) => {
    setIsCustom(false);
    setCustomText('');
    setAmount(v);
  }, []);

  const onCustom = useCallback((raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setCustomText(digits);
    setIsCustom(true);
    const n = parseInt(digits, 10);
    if (!isNaN(n) && n >= MIN_AMOUNT && n <= MAX_AMOUNT) setAmount(n);
    else if (digits === '') setAmount(0);
  }, []);

  const checkout = async () => {
    if (amount < MIN_AMOUNT) return;
    setLoading(true);
    setError('');
    try {
      const apiBase = __DEV__ ? 'https://better-uk-red.vercel.app' : '';
      const resp = await fetch(`${apiBase}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amountPence: amount * 100, quantity: reviews }),
      });
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('API unavailable — is STRIPE_SECRET_KEY set in Vercel?');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url && Platform.OS === 'web') window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            opacity: backdropOpacity,
          }}
        />
        <Pressable onPress={(e) => e.stopPropagation()} style={{ maxWidth: 420, width: '90%' }}>
          <Animated.View style={{ opacity: cardOpacity, transform: [{ scale: cardScale }] }}>
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#e5e5e5',
          backgroundColor: '#fff',
          overflow: 'hidden',
          ...(Platform.OS === 'web' ? ({ boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)' } as any) : {}),
        }}>

        {/* Close button */}
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: pressed ? '#f0f0f0' : '#fafafa',
            alignItems: 'center',
            justifyContent: 'center',
          })}>
          <Text style={{ fontSize: 16, color: '#999', lineHeight: 18 }}>✕</Text>
        </Pressable>

        {/* Counter */}
        <View style={{ paddingTop: 24, paddingBottom: 4, alignItems: 'center' }}>
          <AnimatedCount value={reviews} />
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#999', marginTop: 2, letterSpacing: 0.5 }}>
            {label} reviewed for £{amount || 0}
          </Text>
        </View>

        {/* Amount selector */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
          {/* Presets */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            {PRESETS.map((v) => (
              <Pill key={v} amount={v} active={!isCustom && amount === v} onPress={() => pickPreset(v)} />
            ))}
          </View>

          {/* Custom input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: isCustom ? '#3b82f6' : '#e5e5e5',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 9,
              backgroundColor: isCustom ? '#fafbff' : '#fafaf8',
              ...(Platform.OS === 'web' ? ({ transition: 'border-color .15s ease, background .15s ease' } as any) : {}),
            }}>
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, color: isCustom ? '#3b82f6' : '#bbb', marginRight: 3 }}>£</Text>
            <TextInput
              value={customText}
              onChangeText={onCustom}
              onFocus={() => setIsCustom(true)}
              placeholder="Custom"
              keyboardType="number-pad"
              maxLength={3}
              placeholderTextColor="#ccc"
              style={{
                flex: 1,
                fontFamily: "'DM Mono', monospace",
                fontSize: 15,
                color: '#111',
                padding: 0,
                ...(Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}),
              }}
            />
            {isCustom && customText ? (
              <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3b82f6' }}>
                = {fmt(reviewsFor(parseInt(customText, 10) || 0))} reviews
              </Text>
            ) : null}
          </View>

          {/* Micro copy */}
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#ccc', marginTop: 8, textAlign: 'center', letterSpacing: 0.3 }}>
            £1 per review · Grok reads the full text · results are public
          </Text>
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Pressable
            onPress={checkout}
            disabled={loading || amount < MIN_AMOUNT}
            style={({ pressed }) => ({
              backgroundColor: loading || amount < MIN_AMOUNT ? '#d1d5db' : pressed ? '#1d4ed8' : '#111',
              borderRadius: 10,
              paddingVertical: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              ...(Platform.OS === 'web' ? ({ transition: 'all .15s ease', cursor: loading || amount < MIN_AMOUNT ? 'not-allowed' : 'pointer' } as any) : {}),
            })}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: '600', color: '#fff', letterSpacing: 0.2 }}>
              {loading ? 'Redirecting…' : amount < MIN_AMOUNT ? 'Enter an amount' : `Pay £${amount} — Fund ${fmt(reviews)} reviews`}
            </Text>
          </Pressable>

          {/* Payment badges */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }}>
            {['Apple Pay', 'Google Pay', 'Cards', 'Stripe'].map((m, i) => (
              <Text key={m} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#ccc', letterSpacing: 0.4 }}>
                {i > 0 ? '· ' : ''}{m}
              </Text>
            ))}
          </View>

          {error ? (
            <View style={{ marginTop: 10, backgroundColor: '#fef2f2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 }}>
              <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#dc2626', textAlign: 'center' }}>{error}</Text>
            </View>
          ) : null}
        </View>
      </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Unreviewed item CTA (detail page) ────────────────────────────────────────

interface RequestReviewButtonProps {
  category: 'regulations' | 'ngos' | 'civil-service';
}

export function RequestReviewButton({ category }: RequestReviewButtonProps) {
  return (
    <View style={{ marginTop: 32, marginBottom: 32 }}>
      <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e5', backgroundColor: '#fff', padding: 24 }}>
        <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}>
          AI Review not yet available
        </Text>
        <Text style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#111', marginBottom: 8 }}>
          This item hasn't been reviewed yet
        </Text>
        <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 20 }}>
          Help fund AI reviews — each £1 donation pays for one {category === 'regulations' ? 'piece of legislation' : category === 'ngos' ? 'charity' : 'government body'} to be reviewed by Grok AI. All results are public and permanent.
        </Text>
        <Link href="/" style={{ textDecorationLine: 'none' }}>
          <View
            style={{
              backgroundColor: '#111',
              borderRadius: 8,
              paddingVertical: 14,
              paddingHorizontal: 24,
              alignItems: 'center',
            }}>
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: '600', color: '#fff' }}>
              Fund reviews on the homepage →
            </Text>
          </View>
        </Link>
        <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 12 }}>
          Secure payment via Stripe · Apple Pay · Google Pay · Cards
        </Text>
      </View>
    </View>
  );
}
