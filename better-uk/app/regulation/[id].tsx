import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';

import { mockRegulations, mockNGOs, mockCivilService, type Regulation, type NGO, type CivilServiceBody } from '@/lib/data';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const decodedId = decodeURIComponent(id ?? '');
  const regulation = mockRegulations.find((r) => r.id === decodedId);
  const ngo = mockNGOs.find((n) => n.id === decodedId);
  const csBody = mockCivilService.find((b) => b.id === decodedId);
  const item = regulation ?? ngo ?? csBody;
  const isNGO = !!ngo;
  const isCS = !!csBody;

  if (!item) {
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

  const title = isCS ? (item as CivilServiceBody).name : isNGO ? (item as NGO).name : (item as Regulation).title;
  const year = isCS ? '' : isNGO ? (item as NGO).founded : (item as Regulation).year;
  const typeLabel = isCS ? (item as CivilServiceBody).type : isNGO ? (item as NGO).sector : (item as Regulation).type;
  const verdictLabel = isCS ? item.verdict : isNGO && item.verdict === 'delete' ? 'defund' : item.verdict;
  const isNegativeVerdict = item.verdict === 'delete' || item.verdict === 'abolish';
  const verdictDesc = isNegativeVerdict
    ? isCS
      ? 'Abolish — merge into parent department or cease entirely'
      : isNGO
        ? 'Withdraw charitable status or government funding'
        : 'Remove from the statute book'
    : isCS
      ? 'Retain — performs a critical function of government'
      : isNGO
        ? 'Retain — delivers genuine charitable value'
        : 'Retain — serves a justifiable purpose';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fafaf8' }}
      contentContainerStyle={{ paddingBottom: 80 }}>
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
            {item.id}
          </Text>
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
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#bbb' }}>
            {year}
          </Text>
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

        <Pressable
          onPress={() => Linking.openURL(item.url)}
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
            {isNGO ? 'Visit website' : 'View on legislation.gov.uk'}
          </Text>
          <Text style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#bbb' }}>
            ↗
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
