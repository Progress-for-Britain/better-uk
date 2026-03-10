import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
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

// ── Main fund card (used in hero section) ────────────────────────────────────

interface FundReviewsCardProps {
  category: 'regulations' | 'ngos' | 'civil-service';
}

export function FundReviewsCard({ category }: FundReviewsCardProps) {
  const [amount, setAmount] = useState(10);
  const [customText, setCustomText] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mount animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(slide, { toValue: 0, duration: 500, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [fade, slide]);

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
      const resp = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amountPence: amount * 100, quantity: reviews }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url && Platform.OS === 'web') window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }], maxWidth: 420, width: '100%', marginTop: 32 }}>
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#e5e5e5',
          backgroundColor: '#fff',
          overflow: 'hidden',
          ...(Platform.OS === 'web' ? ({ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.03)' } as any) : {}),
        }}>

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
  );
}

// ── Single-item request (detail page) ────────────────────────────────────────

interface RequestReviewButtonProps {
  itemId: string;
  itemTitle: string;
  category: 'regulations' | 'ngos' | 'civil-service';
}

export function RequestReviewButton({ itemId, itemTitle, category }: RequestReviewButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePress = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemTitle, category }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Checkout failed');
      if (data.url && Platform.OS === 'web') window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <View style={{ marginTop: 32, marginBottom: 32 }}>
      <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e5', backgroundColor: '#fff', padding: 24 }}>
        <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}>
          AI Review not yet available
        </Text>
        <Text style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#111', marginBottom: 8 }}>
          Request an AI Review
        </Text>
        <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 20 }}>
          Pay £1 to have Grok AI analyse this {category === 'regulations' ? 'piece of legislation' : category === 'ngos' ? 'charity' : 'government body'}. Apple Pay, Google Pay, and cards accepted.
        </Text>
        <Pressable
          onPress={handlePress}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: loading ? '#666' : pressed ? '#222' : '#111',
            borderRadius: 8,
            paddingVertical: 14,
            paddingHorizontal: 24,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: loading ? 0.7 : 1,
          })}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: '600', color: '#fff' }}>
            {loading ? 'Redirecting to checkout…' : 'Pay £1 — Request Review'}
          </Text>
        </Pressable>
        <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 12 }}>
          Secure payment via Stripe · Apple Pay · Google Pay · Cards
        </Text>
        {error ? (
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#dc2626', marginTop: 12, textAlign: 'center' }}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Pending banner ───────────────────────────────────────────────────────────

export function ReviewPendingBanner() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1000, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fffbeb', padding: 24, marginTop: 32, marginBottom: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', opacity: pulse }} />
        <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#d97706' }}>
          Review in progress
        </Text>
      </View>
      <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#92400e', lineHeight: 22 }}>
        Payment received. Grok AI is analysing this item — typically 30–60 seconds. Refresh to check for the result.
      </Text>
    </View>
  );
}
