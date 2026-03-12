import { Link, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { RequestReviewButton } from '@/components/request-review';
import { csIndexItems, GROK_MODEL, GROK_PROMPT_CIVIL_SERVICE, GROK_PROMPT_NGOS, GROK_PROMPT_REGULATIONS, mockCivilService, mockNGOs, mockRegulations, ngoIndexItems, type CivilServiceBody, type NGO, type Regulation } from '@/lib/data';

function VerdictBadge({ verdict, label }: { verdict: string; label?: string }) {
  const isNegative = verdict === 'delete' || verdict === 'abolish';
  const displayLabel = label ?? verdict;
  return (
    <View
      style={{
        borderRadius: 99,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        backgroundColor: isNegative ? '#fef2f2' : '#f0fdf4',
      }}>
      <Text
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: isNegative ? '#b91c1c' : '#15803d',
        }}>
        {displayLabel}
      </Text>
    </View>
  );
}

export default function RegulationDetail() {
  const { id, review } = useLocalSearchParams<{ id: string; review?: string }>();
  const decodedId = decodeURIComponent(id ?? '');
  const regulation = mockRegulations.find((r) => r.id === decodedId);
  const ngo = mockNGOs.find((n) => n.id === decodedId);
  const csBody = mockCivilService.find((b) => b.id === decodedId);
  const item = regulation ?? ngo ?? csBody;
  const isNGO = !!ngo;
  const isCS = !!csBody;

  // Check unreviewed index items if not found in reviewed data
  const indexNGO = !item ? ngoIndexItems.find((n) => n.id === decodedId) : null;
  const indexCS = !item ? csIndexItems.find((b) => b.id === decodedId) : null;
  const indexItem = indexNGO ?? indexCS;
  const isUnreviewed = !item && !!indexItem;
  const isPending = review === 'pending';

  if (!item && !indexItem) {
    // Allow requesting a review for any legislation ID (e.g. ukpga/2020/1)
    const isLikelyLegislation = /^uk/.test(decodedId);
    if (isLikelyLegislation || isPending) {
      // Fall through with minimal data — show the request review button
    } else {
      return (
        <View style={{ flex: 1, backgroundColor: '#fafaf8', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#999' }}>
            Item not found.
          </Text>
          <Link href="/" style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#3b82f6' }}>
              ← Back to home
            </Text>
          </Link>
        </View>
      );
    }
  }

  // Derive display fields for both reviewed and unreviewed items
  const isUnreviewedNGO = !!indexNGO;
  const isUnreviewedCS = !!indexCS;
  const effectiveIsNGO = isNGO || isUnreviewedNGO;
  const effectiveIsCS = isCS || isUnreviewedCS;

  const title = item
    ? isCS ? (item as CivilServiceBody).name : isNGO ? (item as NGO).name : (item as Regulation).title
    : indexNGO ? indexNGO.name : indexCS ? indexCS.name : decodedId;

  const year = item
    ? isCS ? '' : isNGO ? (item as NGO).founded : (item as Regulation).year
    : indexNGO ? indexNGO.founded : '';

  const typeLabel = item
    ? isCS ? (item as CivilServiceBody).type : isNGO ? (item as NGO).sector : (item as Regulation).type
    : indexNGO ? indexNGO.sector : indexCS ? indexCS.type : '';

  const category: 'regulations' | 'ngos' | 'civil-service' = effectiveIsCS ? 'civil-service' : effectiveIsNGO ? 'ngos' : 'regulations';

  const verdictLabel = item
    ? isCS ? item.verdict : isNGO && item.verdict === 'delete' ? 'defund' : item.verdict
    : null;

  const isNegativeVerdict = item ? item.verdict === 'delete' || item.verdict === 'abolish' : false;
  const verdictDesc = item
    ? isNegativeVerdict
      ? isCS
        ? 'Abolish — merge into parent department or cease entirely'
        : isNGO
          ? 'Withdraw charitable status or government funding'
          : 'Remove from the statute book'
      : isCS
        ? 'Retain — performs a critical function of government'
        : isNGO
          ? 'Retain — delivers genuine charitable value'
          : 'Retain — serves a justifiable purpose'
    : null;

  const pageTitle = `${title} — better-uk AI Review`;
  const summaryText = item?.summary || (indexNGO?.description ?? indexCS?.description ?? '');
  const pageDesc = summaryText.length > 160 ? summaryText.slice(0, 157) + '...' : summaryText;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fafaf8' }}
      contentContainerStyle={{ paddingBottom: 80 }}>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
      </Head>
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#e5e5e5',
          paddingHorizontal: 24,
          paddingVertical: 16,
          backgroundColor: '#fff',
        }}>
        <Link href="/">
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#888' }}>
            ← better-uk
          </Text>
        </Link>
      </View>

      <View
        style={{
          maxWidth: 768,
          marginHorizontal: 'auto',
          width: '100%',
          paddingHorizontal: 24,
          paddingTop: 48,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#3b82f6' }}>
            {decodedId}
          </Text>
          {typeLabel ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}>
              <Text
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  color: '#999',
                }}>
                {typeLabel}
              </Text>
            </View>
          ) : null}
          {year ? (
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#bbb' }}>
              {year}
            </Text>
          ) : null}
        </View>

        <Text
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 36,
            fontWeight: '400',
            color: '#111',
            lineHeight: 42,
            marginBottom: 24,
          }}>
          {title}
        </Text>

        {/* Reviewed item: show verdict + summary + assessment */}
        {item && verdictLabel ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <VerdictBadge verdict={item.verdict} label={verdictLabel} />
              <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#999' }}>
                AI recommendation: {verdictDesc}
              </Text>
            </View>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: '#e5e5e5',
                paddingTop: 32,
                marginBottom: 32,
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
                Summary
              </Text>
              <Text
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 14,
                  color: '#444',
                  lineHeight: 24,
                }}>
                {item.summary}
              </Text>
            </View>

            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isNegativeVerdict ? '#fecaca' : '#bbf7d0',
                backgroundColor: isNegativeVerdict ? '#fef2f2' : '#f0fdf4',
                padding: 24,
                marginBottom: 32,
              }}>
              <Text
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: '#999',
                  marginBottom: 12,
                }}>
                AI Assessment
              </Text>
              <Text
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 14,
                  color: '#444',
                  lineHeight: 24,
                }}>
                {item.reason}
              </Text>
            </View>
          </>
        ) : null}

        {/* Unreviewed item: show request button */}
        {isUnreviewed ? (
          <>
            {summaryText ? (
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 14,
                    color: '#666',
                    lineHeight: 22,
                  }}>
                  {summaryText}
                </Text>
              </View>
            ) : null}
            <RequestReviewButton
              category={category}
            />
          </>
        ) : null}

        {/* External link */}
        {(item?.url || indexNGO?.url || indexCS?.url) ? (
          <Pressable
            onPress={() => Linking.openURL((item?.url || indexNGO?.url || indexCS?.url)!)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: '#e5e5e5',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              alignSelf: 'flex-start',
              backgroundColor: '#fff',
            }}>
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#666' }}>
              {effectiveIsNGO ? 'Visit website' : 'View on legislation.gov.uk'}
            </Text>
            <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#bbb' }}>
              ↗
            </Text>
          </Pressable>
        ) : null}

        {/* Grok prompt (only for reviewed items) */}
        {item ? <DetailPromptSection isCS={effectiveIsCS} isNGO={effectiveIsNGO} /> : null}
      </View>
    </ScrollView>
  );
}

function DetailPromptSection({ isCS, isNGO }: { isCS: boolean; isNGO: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const prompt = isCS
    ? GROK_PROMPT_CIVIL_SERVICE
    : isNGO
      ? GROK_PROMPT_NGOS
      : GROK_PROMPT_REGULATIONS;

  return (
    <View style={{ marginTop: 48, borderTopWidth: 1, borderTopColor: '#e5e5e5', paddingTop: 32 }}>
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
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{ marginBottom: expanded ? 12 : 0 }}>
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
