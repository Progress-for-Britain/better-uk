import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';

import { FundReviewsModal } from '@/components/request-review';
import { ContentBackground, HeroBackground } from '@/components/skia-background';
import {
  CS_REVIEW_COST_GBP,
  csAbolishPercent,
  csIndexItems,
  csTotalReviewed,
  deletePercent,
  getYearStats,
  GROK_MODEL,
  GROK_PROMPT_CIVIL_SERVICE,
  GROK_PROMPT_NGOS,
  GROK_PROMPT_REGULATIONS,
  legislationYears,
  mockCivilService,
  mockNGOs,
  mockRegulations,
  NGO_REVIEW_COST_GBP,
  ngoDefundPercent,
  ngoIndexItems,
  ngoTotalReviewed,
  REVIEW_COST_GBP,
  TOTAL_UK_CHARITIES,
  TOTAL_UK_CS_BODIES,
  TOTAL_UK_REGULATIONS,
  totalRegulations,
  totalReviewed,
  type CivilServiceBody,
  type CSIndexItem,
  type LegIndexItem,
  type NGO,
  type NGOIndexItem,
  type Regulation
} from '@/lib/data';

// ─── Responsive breakpoint ────────────────────────────────────────────────────

function useIsWide() {
  const { width } = useWindowDimensions();
  return width >= 768;
}

function formatBudget(mn: number): string {
  if (Math.abs(mn) >= 1000) return `£${(mn / 1000).toFixed(1)}bn`;
  return `£${Math.round(mn).toLocaleString()}m`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveCategory = 'regulations' | 'ngos' | 'civil-service';

const CATEGORIES: { id: ActiveCategory; label: string }[] = [
  { id: 'regulations', label: 'Regulations' },
  { id: 'ngos', label: 'NGO Ecosystem' },
  { id: 'civil-service', label: 'Civil Service' },
];

const TOTAL_ACTIVE = TOTAL_UK_REGULATIONS;

function LoadInSection({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(Platform.OS === 'web' ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(Platform.OS === 'web' ? 18 : 0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [delay, opacity, translateY]);

  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Verdict Badge ────────────────────────────────────────────────────────────

function VerdictBadge({ verdict, label }: { verdict: string; label?: string }) {
  const isDelete = verdict === 'delete';
  const displayLabel = label ?? verdict;
  return (
    <View
      style={{
        borderRadius: 99,
        paddingHorizontal: 10,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        backgroundColor: isDelete ? '#fef2f2' : '#f0fdf4',
      }}>
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: 1.4,
          color: isDelete ? '#b91c1c' : '#15803d',
        }}>
        {displayLabel}
      </Text>
    </View>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ percentage, label }: { percentage: number; label: string }) {
  const angle = Math.round((percentage / 100) * 360);
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 200, height: 200, position: 'relative' }}>
        <View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            ...(Platform.OS === 'web'
              ? ({ background: `conic-gradient(#3b82f6 0deg ${angle}deg, #e5e5e5 ${angle}deg 360deg)` } as any)
              : { backgroundColor: '#e5e5e5' }),
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 28,
            left: 28,
            width: 144,
            height: 144,
            borderRadius: 72,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontSize: 40,
              color: '#3b82f6',
              lineHeight: 44,
            }}>
            {percentage}%
          </Text>
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: '#aaa',
              marginTop: 4,
            }}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Site Header ─────────────────────────────────────────────────────────────

function SiteHeader({
  category,
  onChangeCategory,
}: {
  category: ActiveCategory;
  onChangeCategory: (c: ActiveCategory) => void;
}) {
  const isWide = useIsWide();
  return (
    <View
      style={{
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
        backgroundColor: '#ffffff',
        flexDirection: isWide ? 'row' : 'column',
        alignItems: isWide ? 'center' : 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: isWide ? 16 : 12,
        gap: isWide ? 0 : 8,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontSize: 20,
            color: '#111',
          }}>
          better-uk
        </Text>
        <Text
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: '#aaa',
            cursor: 'pointer',
          }}
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.open('https://www.progressforbritain.org/', '_blank');
            }
          }}>
          by Progress for Britain
        </Text>
      </View>
      {isWide ? (
        <View
          style={{
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
          {CATEGORIES.map((cat, i) => (
            <Pressable
              key={cat.id}
              onPress={() => onChangeCategory(cat.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: category === cat.id ? '#3b82f6' : 'transparent',
                borderRightWidth: i < CATEGORIES.length - 1 ? 1 : 0,
                borderRightColor: '#e5e5e5',
              }}>
              <Text
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: category === cat.id ? '#ffffff' : '#666',
                }}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            style={{
              flexDirection: 'row',
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
            {CATEGORIES.map((cat, i) => (
              <Pressable
                key={cat.id}
                onPress={() => onChangeCategory(cat.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: category === cat.id ? '#3b82f6' : 'transparent',
                  borderRightWidth: i < CATEGORIES.length - 1 ? 1 : 0,
                  borderRightColor: '#e5e5e5',
                }}>
                <Text
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: category === cat.id ? '#ffffff' : '#666',
                  }}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ category }: { category: ActiveCategory }) {
  const isWide = useIsWide();
  const [showFundModal, setShowFundModal] = useState(false);
  const isNGO = category === 'ngos';
  const isCS = category === 'civil-service';
  const reviewed = isCS ? csTotalReviewed : isNGO ? ngoTotalReviewed : totalReviewed;
  const total = isCS ? TOTAL_UK_CS_BODIES : isNGO ? TOTAL_UK_CHARITIES : totalRegulations;
  const delPct = isCS ? csAbolishPercent : isNGO ? ngoDefundPercent : deletePercent;
  const cost = isCS ? CS_REVIEW_COST_GBP : isNGO ? NGO_REVIEW_COST_GBP : REVIEW_COST_GBP;
  const pctReviewed = total > 0 ? (reviewed / total) * 100 : 0;

  const heading = isCS
    ? 'Every UK government department, agency, and ALB,'
    : isNGO
      ? "The UK\u2019s leading charities and NGOs,"
      : 'The entire corpus of UK legislation,';
  const headingEm = 'reviewed by AI.';
  const subtitle = isCS
    ? `A review of ${total.toLocaleString()} government bodies — departments, executive agencies, and arms-length bodies — assessed by AI and given a simple verdict: KEEP or ABOLISH.`
    : isNGO
      ? `A review of ${total.toLocaleString()} registered UK charities assessed by AI and given a simple verdict: KEEP or DEFUND.`
      : `A live review of ${total.toLocaleString()} statutory instruments and acts, assessed by AI and given a simple verdict: KEEP or DELETE.`;
  const deleteLabel = isCS ? 'abolished' : isNGO ? 'defunded' : 'deleted';

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: '#ffffff',
          justifyContent: 'center',
          paddingHorizontal: isWide ? 24 : 20,
          paddingVertical: isWide ? 80 : 40,
          overflow: 'hidden',
          position: 'relative',
        },
        Platform.OS === 'web' && isWide ? ({ minHeight: '80vh' } as any) : undefined,
      ]}>
      <HeroBackground />
      <View
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1200,
          width: '100%',
          marginHorizontal: 'auto',
          flexDirection: isWide ? 'row' : 'column',
          alignItems: isWide ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          gap: isWide ? 60 : 32,
        }}>
        {/* Left content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Eyebrow */}
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#3b82f6',
              marginBottom: 28,
            }}>
            Token cost: £{cost.toFixed(2)}
            {'  ·  '}
            {isCS ? 'Abolition' : isNGO ? 'Defund' : 'Deletion'} recommendation:{' '}
            <Text style={{ color: '#111', fontWeight: '500' }}>{delPct}%</Text>
          </Text>

          {/* Heading */}
          <Text
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: isWide ? 72 : 38,
              fontWeight: '400',
              lineHeight: isWide ? 74 : 44,
              color: '#111',
              marginBottom: 24,
              maxWidth: 780,
            }}>
            {heading}
            {'\n'}
            <Text style={{ fontStyle: 'italic', color: '#3b82f6' }}>{headingEm}</Text>
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
              fontWeight: '300',
              color: 'rgba(0,0,0,0.45)',
              maxWidth: 520,
              lineHeight: 24,
              marginBottom: isWide ? 56 : 28,
            }}>
            {subtitle}
          </Text>

          {/* Progress bar */}
          <View style={{ maxWidth: 700, width: '100%' }}>
            <View
              style={{
                height: 3,
                backgroundColor: 'rgba(0,0,0,0.08)',
                borderRadius: 99,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  height: '100%',
                  borderRadius: 99,
                  width: `${Math.min(pctReviewed, 100)}%` as any,
                  ...(Platform.OS === 'web'
                    ? ({ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' } as any)
                    : { backgroundColor: '#3b82f6' }),
                }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16,
              }}>
              {(!isCS && !isNGO) && (
                <Text
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: 'rgba(0,0,0,0.3)',
                    letterSpacing: 0.5,
                  }}>
                  1801 ——————— 2025
                </Text>
              )}
              <Text
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13,
                  color: 'rgba(0,0,0,0.5)',
                  letterSpacing: 0.4,
                }}>
                <Text style={{ color: '#3b82f6', fontWeight: '500' }}>
                  {reviewed.toLocaleString()}
                </Text>{' '}
                AI-reviewed{'  ·  '}
                {total.toLocaleString()} {isCS ? 'bodies' : isNGO ? 'charities' : 'items'} scraped
              </Text>
            </View>
          </View>

          {/* Fund reviews button */}
          <Pressable
            onPress={() => setShowFundModal(true)}
            style={({ pressed }) => ({
              marginTop: 20,
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: pressed ? '#3b82f6' : '#e0e0e0',
              backgroundColor: pressed ? '#eff6ff' : '#fff',
              ...(Platform.OS === 'web' ? ({ transition: 'all .15s ease', cursor: 'pointer' } as any) : {}),
            })}>
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#3b82f6', fontWeight: '500' }}>
              Fund reviews →
            </Text>
          </Pressable>
          <FundReviewsModal visible={showFundModal} onClose={() => setShowFundModal(false)} category={category} />
        </View>

        {/* Right: Donut chart — wide viewports only */}
        {isWide && (
          <View style={{ flexShrink: 0 }}>
            <DonutChart percentage={delPct} label={deleteLabel} />
            <View style={{ marginTop: 20, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }}
                />
                <Text
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: '#888',
                    letterSpacing: 0.8,
                  }}>
                  Recommend {isCS ? 'abolish' : isNGO ? 'defund' : 'delete'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e5e5' }}
                />
                <Text
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 11,
                    color: '#888',
                    letterSpacing: 0.8,
                  }}>
                  Recommend keep
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Year Bar Chart ───────────────────────────────────────────────────────────

function YearChart({
  selectedYear,
  onSelectYear,
}: {
  selectedYear: number | null;
  onSelectYear: (y: string | number | null) => void;
}) {
  const yearStats = getYearStats();
  const maxTotal = Math.max(...yearStats.map((y) => y.total));
  const MAX_H = 280;

  return (
    <View style={{ paddingVertical: 64, borderTopWidth: 1, borderTopColor: '#e5e5e5' }}>
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#3b82f6',
          marginBottom: 16,
        }}>
        {yearStats.length > 0 ? `${yearStats[0].year} — ${yearStats[yearStats.length - 1].year}` : ''}
      </Text>
      <Text
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 42,
          color: '#111',
          marginBottom: 12,
          lineHeight: 46,
        }}>
        Regulations,{' '}
        <Text style={{ fontStyle: 'italic', color: '#3b82f6' }}>by year</Text>
      </Text>
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          color: '#999',
          maxWidth: 520,
          lineHeight: 22,
          marginBottom: 40,
        }}>
        Every piece of UK legislation plotted by year of enactment — scroll right for
        older years. Blue shows what AI has reviewed so far.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 6,
            height: MAX_H + 30,
            paddingBottom: 24,
          }}>
          {yearStats.map(({ year, total, reviewed }) => {
            const barH = Math.max(4, Math.round((total / maxTotal) * MAX_H));
            const reviewedH =
              reviewed > 0 ? Math.max(2, Math.round((reviewed / total) * barH)) : 0;
            const isSelected = selectedYear === year;

            return (
              <Pressable
                key={year}
                onPress={() => onSelectYear(isSelected ? null : year)}
                style={{
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: MAX_H + 30,
                }}>
                <View
                  style={{
                    width: 20,
                    height: barH,
                    backgroundColor: isSelected ? '#d1d5db' : '#e5e5e5',
                    borderRadius: 4,
                    overflow: 'hidden',
                    justifyContent: 'flex-end',
                  }}>
                  {reviewedH > 0 && (
                    <View
                      style={{
                        width: '100%' as any,
                        height: reviewedH,
                        backgroundColor: isSelected ? '#1d4ed8' : '#3b82f6',
                        borderRadius: 4,
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: isSelected ? '#111' : '#888',
                    marginTop: 6,
                  }}>
                  {String(year).slice(2)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 24, marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#e5e5e5' }}
          />
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#666' }}>
            Total regulations
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#3b82f6' }}
          />
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#666' }}>
            Reviewed
          </Text>
        </View>
      </View>

      {selectedYear && (
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <Text
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#111' }}>
              Filtered: {selectedYear}
            </Text>
            <Pressable onPress={() => onSelectYear(null)}>
              <Text
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#999' }}>
                ✕ clear
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function RegulationRow({ item, isNGO, isCS }: { item: Regulation | NGO | CivilServiceBody; isNGO: boolean; isCS: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isMobile = !useIsWide();
  const displayName = isCS
    ? (item as CivilServiceBody).name
    : isNGO
      ? (item as NGO).name
      : (item as Regulation).title;
  const verdictLabel = isCS ? item.verdict : isNGO && item.verdict === 'delete' ? 'defund' : undefined;

  if (isMobile) {
    return (
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0ee',
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 6,
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#111',
              fontWeight: '500',
              flex: 1,
              lineHeight: 18,
            }}
            numberOfLines={expanded ? undefined : 2}>
            {displayName}
          </Text>
          <VerdictBadge verdict={item.verdict} label={verdictLabel} />
        </View>
        <Text
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: '#555',
            lineHeight: 18,
          }}
          numberOfLines={expanded ? undefined : 3}>
          {item.summary}
        </Text>
        {expanded && item.reason ? (
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#888',
              lineHeight: 18,
            }}>
            {item.reason}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#ccc', letterSpacing: 0.5 }}>
            {expanded ? '▾ collapse' : '▸ expand'}
          </Text>
          <Link href={`/regulation/${encodeURIComponent(item.id)}`}>
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#3b82f6' }}>
              Detail ↗
            </Text>
          </Link>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0ee',
        paddingVertical: 14,
        paddingHorizontal: 16,
      }}>
      {/* ID + Link */}
      <View style={{ width: 140, flexShrink: 0 }}>
        <Text
          style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#888' }}
          numberOfLines={1}>
          {item.id}
        </Text>
        <Link href={`/regulation/${encodeURIComponent(item.id)}`}>
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#3b82f6',
              marginTop: 4,
              letterSpacing: 0.4,
            }}>
            View ↗
          </Text>
        </Link>
      </View>

      {/* Verdict */}
      <View style={{ width: 80, flexShrink: 0, paddingTop: 2 }}>
        <VerdictBadge
          verdict={item.verdict}
          label={verdictLabel}
        />
      </View>

      {/* Summary */}
      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        <Text
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: '#444',
            lineHeight: 18,
          }}
          numberOfLines={expanded ? undefined : 2}>
          {item.summary}
        </Text>
      </View>

      {/* Reason */}
      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        <Text
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: '#444',
            lineHeight: 18,
          }}
          numberOfLines={expanded ? undefined : 2}>
          {item.reason}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Verdicts Table ───────────────────────────────────────────────────────────

function VerdictsTable({
  items,
  selectedFilter,
  onSelectFilter,
  isNGO,
  isCS,
}: {
  items: (Regulation | NGO | CivilServiceBody)[];
  selectedFilter: string | number | null;
  onSelectFilter: (v: string | number | null) => void;
  isNGO: boolean;
  isCS: boolean;
}) {
  const isWide = useIsWide();
  const [search, setSearch] = useState('');

  // Filter field: CS=type string, NGO=sector string, legislation=year number
  const filterField = isCS ? 'type' : isNGO ? 'sector' : 'year';
  const filterValues: (string | number)[] = isCS
    ? [...new Set(items.map((r) => (r as CivilServiceBody).type))].sort()
    : isNGO
      ? [...new Set(items.map((r) => (r as NGO).sector))].sort()
      : [...new Set(items.map((r) => (r as Regulation).year))].sort((a, b) => a - b);

  const filtered = useMemo(() => {
    let result = items;
    if (selectedFilter !== null) {
      result = result.filter((r) => (r as any)[filterField] === selectedFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          ((r as any).name ?? (r as any).title ?? r.id).toLowerCase().includes(q) ||
          (r.summary ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, selectedFilter, search, filterField]);

  const keeps = filtered.filter((r) => r.verdict === 'keep').length;
  const deletes = isCS
    ? filtered.filter((r) => (r as CivilServiceBody).verdict === 'abolish').length
    : filtered.filter((r) => r.verdict === 'delete').length;

  return (
    <View style={{ paddingVertical: 64 }}>
      {/* Section heading + year selector */}
      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          alignItems: isWide ? 'flex-end' : 'flex-start',
          justifyContent: 'space-between',
          marginBottom: isWide ? 40 : 24,
          gap: 16,
        }}>
        <View>
          <Text
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 42,
              color: '#111',
              marginBottom: 8,
              lineHeight: 46,
            }}>
            {isCS ? 'Civil Service' : isNGO ? 'NGO' : 'Regulation'}{' '}
            <Text style={{ fontStyle: 'italic', color: '#3b82f6' }}>verdicts</Text>
          </Text>
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#999',
              letterSpacing: 0.5,
            }}>
            Keep · {isCS ? 'Abolish' : isNGO ? 'Defund' : 'Delete'} · AI-generated review per{' '}
            {isCS ? 'body' : isNGO ? 'organisation' : 'regulation'}
          </Text>
        </View>

        {/* Search + filter pills */}
        <View style={{ alignItems: isWide ? 'flex-end' : 'stretch', gap: 8 }}>
          {/* Text search */}
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${isCS ? 'bodies' : isNGO ? 'charities' : 'regulations'}...`}
            placeholderTextColor="#bbb"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#111',
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 8,
              minWidth: isWide ? 260 : 0,
              backgroundColor: '#fff',
            }}
          />
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#aaa',
            }}>
            Filter by {isCS ? 'type' : isNGO ? 'sector' : 'year'}
          </Text>
          {filterValues.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: 'row',
                  borderWidth: 1,
                  borderColor: '#e5e5e5',
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: '#fafaf8',
                }}>
                {filterValues.map((y, i) => (
                  <Pressable
                    key={String(y)}
                    onPress={() => onSelectFilter(selectedFilter === y ? null : y)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: selectedFilter === y ? '#3b82f6' : 'transparent',
                      borderRightWidth: i < filterValues.length - 1 ? 1 : 0,
                      borderRightColor: '#e5e5e5',
                    }}>
                    <Text
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 13,
                        color: selectedFilter === y ? '#fff' : '#666',
                      }}>
                      {y}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Stats strip */}
      <View style={{ flexDirection: 'row', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }}
          />
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#666' }}>
            <Text style={{ color: '#111', fontWeight: '500' }}>{filtered.length}</Text>{' '}
            {isCS ? 'bodies' : isNGO ? 'organisations' : 'regulations'} reviewed
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }}
          />
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#666' }}>
            <Text style={{ color: '#111', fontWeight: '500' }}>{keeps}</Text> keep
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }}
          />
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#666' }}>
            <Text style={{ color: '#111', fontWeight: '500' }}>{deletes}</Text>{' '}
            {isCS ? 'abolish' : isNGO ? 'defund' : 'delete'}
          </Text>
        </View>
      </View>

      {/* Table */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#e5e5e5',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
        {/* Table header — wide viewports only */}
        {isWide && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#f5f5f3',
              borderBottomWidth: 1,
              borderBottomColor: '#e5e5e5',
              paddingVertical: 12,
              paddingHorizontal: 16,
            }}>
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                fontWeight: '500',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: '#999',
                width: 140,
              }}>
              {isCS ? 'Body' : isNGO ? 'Organisation' : 'Regulation'}
            </Text>
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                fontWeight: '500',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: '#999',
                width: 80,
              }}>
              Verdict
            </Text>
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                fontWeight: '500',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: '#999',
                flex: 1,
                paddingHorizontal: 8,
              }}>
              Summary
            </Text>
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                fontWeight: '500',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: '#999',
                flex: 1,
                paddingHorizontal: 8,
              }}>
              Reason
            </Text>
          </View>
        )}

        {/* Rows */}
        {filtered.length === 0 ? (
          <View style={{ padding: 48, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: '#bbb',
                letterSpacing: 0.5,
              }}>
              No verdicts available for this year yet.
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <RegulationRow key={item.id} item={item} isNGO={isNGO} isCS={isCS} />
          ))
        )}
      </View>
    </View>
  );
}

// ─── Index Browser ────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function IndexRow({
  item,
  isCS,
  isNGO,
}: {
  item: CSIndexItem | NGOIndexItem | LegIndexItem;
  isCS: boolean;
  isNGO: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isMobile = !useIsWide();
  const isLeg = !isCS && !isNGO;
  const cs = item as CSIndexItem;
  const ngo = item as NGOIndexItem;
  const leg = item as LegIndexItem;
  const name = isCS ? cs.name : isLeg ? leg.title : ngo.name;
  const tag = isCS ? cs.type : isLeg ? leg.type : ngo.sector;
  const meta = isCS
    ? [
        cs.headcount != null ? `${cs.headcount.toLocaleString()} staff` : null,
        cs.budgetMn != null ? `${formatBudget(cs.budgetMn)} budget` : null,
        cs.budgetMn == null && cs.deptBudgetMn != null ? `Dept budget: ${formatBudget(cs.deptBudgetMn)}` : null,
      ].filter(Boolean).join('  ·  ') || cs.abbreviation || ''
    : isLeg
      ? leg.year > 0 ? String(leg.year) : ''
      : [ngo.annualIncome && `Income ${ngo.annualIncome}`, ngo.annualSpending && `Spending ${ngo.annualSpending}`]
          .filter(Boolean)
          .join('  ·  ');
  const description = isCS ? cs.description : isLeg ? leg.description : ngo.description;
  const externalUrl = isCS ? cs.url : isLeg ? leg.url : ngo.url;
  const parentLabel = isCS && cs.parentDept ? `Parent: ${cs.parentDept}` : '';

  if (isMobile) {
    return (
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0ee',
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 6,
        }}>
        <Text
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: '#111',
            fontWeight: '500',
            lineHeight: 18,
          }}
          numberOfLines={expanded ? undefined : 2}>
          {name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {tag ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}>
              <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#888', letterSpacing: 0.6 }}>
                {tag}
              </Text>
            </View>
          ) : null}
          {parentLabel ? (
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#aaa' }}>
              {parentLabel}
            </Text>
          ) : null}
          {meta ? (
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555' }}>{meta}</Text>
          ) : null}
          {externalUrl ? (
            <Link href={externalUrl as any} target="_blank">
              <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#3b82f6', letterSpacing: 0.4 }}>View ↗</Text>
            </Link>
          ) : null}
        </View>
        {description ? (
          <Text
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#777', lineHeight: 18 }}
            numberOfLines={expanded ? undefined : 2}>
            {description}
          </Text>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0ee',
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 12,
      }}>
      {/* Name + tag */}
      <View style={{ flex: 2, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: '#111',
            fontWeight: '500',
            marginBottom: 4,
          }}
          numberOfLines={expanded ? undefined : 1}>
          {name}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {tag ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}>
              <Text
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: '#888',
                  letterSpacing: 0.6,
                }}>
                {tag}
              </Text>
            </View>
          ) : null}
          {parentLabel ? (
            <Text
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#aaa' }}>
              {parentLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Financials / meta */}
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        {meta ? (
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#555',
              lineHeight: 18,
            }}>
            {meta}
          </Text>
        ) : null}
        {isNGO && (ngo as NGOIndexItem).founded > 0 ? (
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#bbb',
              marginTop: 2,
            }}>
            Est. {(ngo as NGOIndexItem).founded}
          </Text>
        ) : null}
      </View>

      {/* Description */}
      <View style={{ flex: 2, minWidth: 0, justifyContent: 'center' }}>
        {description ? (
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#777',
              lineHeight: 18,
            }}
            numberOfLines={expanded ? undefined : 2}>
            {description}
          </Text>
        ) : (
          <Text
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#ccc' }}>
            No description
          </Text>
        )}
      </View>

      {/* External link */}
      <View style={{ justifyContent: 'center', flexShrink: 0 }}>
        {externalUrl ? (
          <Link href={externalUrl as any} target="_blank">
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#3b82f6',
                letterSpacing: 0.4,
              }}>
              View ↗
            </Text>
          </Link>
        ) : null}
      </View>
    </Pressable>
  );
}

function IndexBrowser({ category }: { category: ActiveCategory }) {
  const isNGO = category === 'ngos';
  const isCS = category === 'civil-service';
  const isWide = useIsWide();
  const isLeg = category === 'regulations';
  const [showFundModal, setShowFundModal] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'budget'>('name');
  const [page, setPage] = useState(0);

  // Per-year lazy loading for legislation
  const [selectedYear, setSelectedYear] = useState<number | null>(
    legislationYears.length > 0 ? legislationYears[0].year : null
  );
  const [yearItems, setYearItems] = useState<LegIndexItem[]>([]);
  const [loadingYear, setLoadingYear] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);
  const fetchedYearsRef = useRef<Map<number, LegIndexItem[]>>(new Map());

  const fetchYear = useCallback(async (year: number) => {
    // Use cache if available
    if (fetchedYearsRef.current.has(year)) {
      setYearItems(fetchedYearsRef.current.get(year)!);
      return;
    }
    setLoadingYear(true);
    setYearError(null);
    try {
      const resp = await fetch(`/data/legislation/${year}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const items: LegIndexItem[] = (data.items ?? []).map((item: any) => ({
        id: item.id,
        title: item.title ?? item.id,
        year: item.year ?? year,
        type: (item.type ?? 'Act') as any,
        url: item.url ?? '',
        description: item.description ?? '',
      }));
      fetchedYearsRef.current.set(year, items);
      setYearItems(items);
    } catch (err: any) {
      setYearError(err.message ?? 'Failed to load');
      setYearItems([]);
    } finally {
      setLoadingYear(false);
    }
  }, []);

  useEffect(() => {
    if (isLeg && selectedYear !== null) {
      fetchYear(selectedYear);
    }
  }, [isLeg, selectedYear, fetchYear]);

  useEffect(() => {
    setPage(0);
  }, [search, selectedType, category, sortBy, selectedYear]);

  // Reset sort when switching categories (budget only makes sense for CS)
  useEffect(() => {
    setSortBy('name');
  }, [category]);

  // Reset year selection when switching to regulations tab
  useEffect(() => {
    if (isLeg && legislationYears.length > 0 && selectedYear === null) {
      setSelectedYear(legislationYears[0].year);
    }
  }, [isLeg, selectedYear]);

  // For legislation, use lazy-loaded year items; for others, use static data
  const allItems = isCS ? csIndexItems : isNGO ? ngoIndexItems : yearItems;

  const typeOptions: string[] = isCS
    ? [...new Set(csIndexItems.map((i) => i.type))].sort()
    : isNGO
      ? [...new Set(ngoIndexItems.map((i) => i.sector))].sort()
      : [...new Set(yearItems.map((i) => i.type))].sort();

  const filtered = useMemo(() => {
    let result = allItems as (CSIndexItem | NGOIndexItem | LegIndexItem)[];
    if (selectedType) {
      result = result.filter((i) =>
        isCS
          ? (i as CSIndexItem).type === selectedType
          : isLeg
            ? (i as LegIndexItem).type === selectedType
            : (i as NGOIndexItem).sector === selectedType
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) => {
        const name = isLeg ? (i as LegIndexItem).title : (i as CSIndexItem | NGOIndexItem).name;
        return name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
      });
    }
    // Sort by budget (descending) for CS when selected
    if (isCS && sortBy === 'budget') {
      result = [...result].sort((a, b) => {
        const aCS = a as CSIndexItem;
        const bCS = b as CSIndexItem;
        const aBudget = aCS.budgetMn ?? aCS.deptBudgetMn ?? -1;
        const bBudget = bCS.budgetMn ?? bCS.deptBudgetMn ?? -1;
        return bBudget - aBudget;
      });
    }
    return result;
  }, [allItems, selectedType, search, isCS, isLeg, sortBy]);

  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const browseLabel = isCS ? 'civil service bodies' : isNGO ? 'charities' : 'regulations';
  const totalNote = isNGO
    ? `Showing top ${ngoIndexItems.length.toLocaleString()} of 171,168 charities by annual income`
    : isCS
      ? `${csIndexItems.length.toLocaleString()} bodies scraped`
      : selectedYear
        ? `Showing ${selectedYear} · ${yearItems.length.toLocaleString()} of ${TOTAL_UK_REGULATIONS.toLocaleString()} regulations`
        : `${TOTAL_UK_REGULATIONS.toLocaleString()} regulations scraped · select a year to browse`;

  return (
    <View style={{ paddingVertical: 64, borderTopWidth: 1, borderTopColor: '#e5e5e5' }}>
      {/* Heading */}
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#3b82f6',
          marginBottom: 16,
        }}>
        Complete index
      </Text>
      <Text
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 42,
          color: '#111',
          marginBottom: 8,
          lineHeight: 46,
        }}>
        Browse all{' '}
        <Text style={{ fontStyle: 'italic', color: '#3b82f6' }}>{browseLabel}</Text>
      </Text>
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          color: '#999',
          marginBottom: 32,
          lineHeight: 22,
        }}>
        {totalNote}
      </Text>

      {/* Donate CTA */}
      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          alignItems: isWide ? 'center' : 'stretch',
          gap: isWide ? 20 : 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e0eaff',
          backgroundColor: '#f8faff',
          padding: isWide ? 20 : 16,
          marginBottom: 32,
        }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 18,
              color: '#111',
              marginBottom: 4,
            }}>
            Help us review{' '}
            <Text style={{ fontStyle: 'italic', color: '#3b82f6' }}>everything</Text>
          </Text>
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#888',
              lineHeight: 18,
            }}>
            Each 1p funds one AI review. Every result is public and permanent.
          </Text>
        </View>
        <Pressable
          onPress={() => setShowFundModal(true)}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
            backgroundColor: pressed ? '#1d4ed8' : '#3b82f6',
            alignItems: 'center',
            alignSelf: isWide ? 'center' : 'stretch',
            ...(Platform.OS === 'web' ? ({ transition: 'all .15s ease', cursor: 'pointer' } as any) : {}),
          })}>
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              fontWeight: '600',
              color: '#fff',
            }}>
            Fund reviews
          </Text>
        </Pressable>
      </View>
      <FundReviewsModal visible={showFundModal} onClose={() => setShowFundModal(false)} category={category} />

      {/* Search + year/type filter + sort */}
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 12, marginBottom: 24, alignItems: isWide ? 'flex-end' : 'stretch' }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${browseLabel}...`}
          placeholderTextColor="#bbb"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            color: '#111',
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: '#fff',
            ...(isWide ? { minWidth: 300, flex: 1 } : {}),
          }}
        />
        {/* Year selector for legislation */}
        {isLeg && legislationYears.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View
              style={{
                flexDirection: 'row',
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: '#fafaf8',
              }}>
              {legislationYears.map((ys, i) => (
                <Pressable
                  key={ys.year}
                  onPress={() => { setSelectedType(null); setSelectedYear(ys.year); }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    backgroundColor: selectedYear === ys.year ? '#3b82f6' : 'transparent',
                    borderRightWidth: i < legislationYears.length - 1 ? 1 : 0,
                    borderRightColor: '#e5e5e5',
                  }}>
                  <Text
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: selectedYear === ys.year ? '#fff' : '#666',
                    }}>
                    {ys.year}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
        {isCS && (
          <View
            style={{
              flexDirection: 'row',
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#fafaf8',
            }}>
            {(['name', 'budget'] as const).map((s, i) => (
              <Pressable
                key={s}
                onPress={() => setSortBy(s)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: sortBy === s ? '#3b82f6' : 'transparent',
                  borderRightWidth: i === 0 ? 1 : 0,
                  borderRightColor: '#e5e5e5',
                }}>
                <Text
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: sortBy === s ? '#fff' : '#666',
                  }}>
                  {s === 'name' ? 'Sort A–Z' : 'Sort by budget'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            style={{
              flexDirection: 'row',
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#fafaf8',
            }}>
            <Pressable
              onPress={() => setSelectedType(null)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: selectedType === null ? '#3b82f6' : 'transparent',
                borderRightWidth: 1,
                borderRightColor: '#e5e5e5',
              }}>
              <Text
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12,
                  color: selectedType === null ? '#fff' : '#666',
                }}>
                All
              </Text>
            </Pressable>
            {typeOptions.map((t, i) => (
              <Pressable
                key={t}
                onPress={() => setSelectedType(selectedType === t ? null : t)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: selectedType === t ? '#3b82f6' : 'transparent',
                  borderRightWidth: i < typeOptions.length - 1 ? 1 : 0,
                  borderRightColor: '#e5e5e5',
                }}>
                <Text
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: selectedType === t ? '#fff' : '#666',
                  }}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Result count */}
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: '#aaa',
          marginBottom: 16,
        }}>
        {filtered.length.toLocaleString()} results{' '}
        {search || selectedType ? '(filtered)' : ''}
        {'  ·  '}page {page + 1} of {totalPages}
      </Text>

      {/* Table */}
      <View
        style={{
          borderWidth: 1,
          borderColor: '#e5e5e5',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 24,
        }}>
        {/* Header — wide viewports only */}
        {isWide && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#f5f5f3',
              borderBottomWidth: 1,
              borderBottomColor: '#e5e5e5',
              paddingVertical: 10,
              paddingHorizontal: 16,
              gap: 12,
            }}>
            {[
              ['Name', 2],
              [isCS ? 'Financial / staff' : isNGO ? 'Income / spending' : 'Year', 1],
              ['Description', 2],
              ['Link', 0],
            ].map(([label, flex]) => (
              <Text
                key={String(label)}
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: '500',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: '#999',
                  flex: (flex as number) || undefined,
                  flexShrink: (flex as number) === 0 ? 0 : undefined,
                  width: (flex as number) === 0 ? 50 : undefined,
                }}>
                {String(label)}
              </Text>
            ))}
          </View>
        )}

        {isLeg && loadingYear ? (
          <View style={{ padding: 48, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: '#bbb',
                marginTop: 12,
              }}>
              Loading {selectedYear} legislation…
            </Text>
          </View>
        ) : isLeg && yearError ? (
          <View style={{ padding: 48, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: '#e74c3c',
              }}>
              Failed to load data for {selectedYear}
            </Text>
          </View>
        ) : pageItems.length === 0 ? (
          <View style={{ padding: 48, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: '#bbb',
              }}>
              No results.
            </Text>
          </View>
        ) : (
          pageItems.map((item) => (
            <IndexRow key={item.id} item={item} isCS={isCS} isNGO={isNGO} />
          ))
        )}
      </View>

      {/* Pagination */}
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
        <Pressable
          onPress={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          style={{
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            opacity: page === 0 ? 0.4 : 1,
          }}>
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#555' }}>
            ← Prev
          </Text>
        </Pressable>
        <View
          style={{
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}>
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#888' }}>
            {page + 1} / {totalPages}
          </Text>
        </View>
        <Pressable
          onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          style={{
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            opacity: page >= totalPages - 1 ? 0.4 : 1,
          }}>
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#555' }}>
            Next →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Prompt Section ───────────────────────────────────────────────────────────

function PromptSection({ category }: { category: ActiveCategory }) {
  const [expanded, setExpanded] = useState(false);
  const isCS = category === 'civil-service';
  const isNGO = category === 'ngos';
  const prompt = isCS
    ? GROK_PROMPT_CIVIL_SERVICE
    : isNGO
      ? GROK_PROMPT_NGOS
      : GROK_PROMPT_REGULATIONS;

  return (
    <View
      style={{
        maxWidth: 1200,
        width: '100%',
        marginHorizontal: 'auto',
        paddingHorizontal: 24,
        paddingVertical: 48,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
      }}>
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: '#bbb',
          marginBottom: 12,
        }}>
        Prompt used ({GROK_MODEL})
      </Text>
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          color: '#999',
          lineHeight: 22,
          marginBottom: 16,
        }}>
        Every AI verdict on this page was generated using the prompt below — no hidden instructions.
      </Text>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{ marginBottom: expanded ? 16 : 0 }}>
        <Text
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: '#3b82f6',
          }}>
          {expanded ? '▾ Hide prompt' : '▸ Show full prompt'}
        </Text>
      </Pressable>
      {expanded && (
        <View
          style={{
            backgroundColor: '#f5f5f3',
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 12,
            padding: 20,
          }}>
          <Text
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#444',
              lineHeight: 20,
            }}
            selectable>
            {prompt}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const isWide = useIsWide();
  const { funded } = useLocalSearchParams<{ funded?: string }>();
  const [showFundedBanner, setShowFundedBanner] = useState(!!funded);
  const [category, setCategory] = useState<ActiveCategory>('regulations');
  const [selectedFilter, setSelectedFilter] = useState<string | number | null>(null);

  const handleCategoryChange = (c: ActiveCategory) => {
    setCategory(c);
    setSelectedFilter(null);
  };

  const isNGO = category === 'ngos';
  const isCS = category === 'civil-service';
  const items: (Regulation | NGO | CivilServiceBody)[] = isCS
    ? mockCivilService
    : isNGO
      ? mockNGOs
      : mockRegulations;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fafaf8' }}
      contentContainerStyle={{ paddingBottom: 80 }}>
      <LoadInSection delay={40}>
        <SiteHeader category={category} onChangeCategory={handleCategoryChange} />
      </LoadInSection>

      {/* Thank-you banner after successful payment */}
      {showFundedBanner && funded ? (
        <View
          style={{
            maxWidth: 1200,
            width: '100%',
            marginHorizontal: 'auto',
            paddingHorizontal: 24,
            marginTop: 16,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#bbf7d0',
              backgroundColor: '#f0fdf4',
              paddingVertical: 14,
              paddingHorizontal: 20,
            }}>
            <Text
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                color: '#15803d',
                flex: 1,
              }}>
              Thank you! You funded {funded} review{funded === '1' ? '' : 's'}. We'll run them in the next batch.
            </Text>
            <Pressable onPress={() => setShowFundedBanner(false)}>
              <Text style={{ fontSize: 16, color: '#86efac', marginLeft: 12 }}>✕</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <LoadInSection delay={120}>
        <HeroSection category={category} />
      </LoadInSection>
      <LoadInSection delay={220}>
        <View
          style={{
            maxWidth: 1200,
            width: '100%',
            marginHorizontal: 'auto',
            paddingHorizontal: 24,
            position: 'relative',
          }}>
          <ContentBackground />
          {!isNGO && !isCS && (
            <YearChart selectedYear={typeof selectedFilter === 'number' ? selectedFilter : null} onSelectYear={setSelectedFilter} />
          )}
          <VerdictsTable
            items={items}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            isNGO={isNGO}
            isCS={isCS}
          />
          <IndexBrowser category={category} />
        </View>
      </LoadInSection>

      {/* Grok prompt */}
      <LoadInSection delay={320}>
        <PromptSection category={category} />
      </LoadInSection>

      {/* Footer */}
      <LoadInSection delay={400}>
        <View
          style={{
            maxWidth: 1200,
            width: '100%',
            marginHorizontal: 'auto',
            paddingHorizontal: 24,
            borderTopWidth: 1,
            borderTopColor: '#e5e5e5',
            paddingVertical: 32,
            flexDirection: isWide ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: isWide ? 'center' : 'flex-start',
            gap: isWide ? 0 : 8,
          }}>
          <Text
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#bbb' }}>
            Inspired by <Text style={{ color: '#888' }}>bettereu.com</Text>
            {' · '}Created by{' '}
            <Text
              style={{ color: '#888' }}
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.open('https://www.progressforbritain.org/', '_blank');
                }
              }}>
              Progress for Britain
            </Text>
          </Text>
          <Text
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#bbb' }}>
            {totalReviewed.toLocaleString()} of {TOTAL_ACTIVE.toLocaleString()} active UK
            regulations reviewed
          </Text>
        </View>
      </LoadInSection>
    </ScrollView>
  );
}
