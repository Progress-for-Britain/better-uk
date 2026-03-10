import { Platform, StyleSheet, View } from 'react-native';

// Encode SVG wave paths as CSS background-image data URIs.
// This works through React Native Web's style passthrough (dangerouslySetInnerHTML does NOT).

const wave1 = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 320"><path d="M0,160 C200,100 400,260 600,180 C800,100 1000,40 1200,160 C1400,280 1600,100 1800,180 C2000,260 2200,100 2400,160 L2400,320 L0,320 Z" fill="rgba(59,130,246,0.08)"/></svg>`
);
const wave2 = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 320"><path d="M0,200 C150,140 350,280 600,200 C850,120 1000,60 1200,200 C1400,340 1600,140 1800,200 C2000,260 2200,120 2400,200 L2400,320 L0,320 Z" fill="rgba(96,165,250,0.07)"/></svg>`
);
const wave3 = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 320"><path d="M0,240 C300,190 500,290 800,230 C1100,170 1300,270 1600,230 C1900,190 2100,290 2400,240 L2400,320 L0,320 Z" fill="rgba(59,130,246,0.05)"/></svg>`
);

// ─── Web: CSS wave background ─────────────────────────────────────────────────

function WebWaveBackground() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Wave layer 1 — slow */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundImage: `url("data:image/svg+xml,${wave1}")`,
            backgroundSize: '100vw 100%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom left',
            animation: 'wave-flow-1 20s linear infinite',
          } as any,
        ]}
      />
      {/* Wave layer 2 — medium */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundImage: `url("data:image/svg+xml,${wave2}")`,
            backgroundSize: '100vw 80%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom left',
            animation: 'wave-flow-2 14s linear infinite',
          } as any,
        ]}
      />
      {/* Wave layer 3 — fastest */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundImage: `url("data:image/svg+xml,${wave3}")`,
            backgroundSize: '100vw 60%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'bottom left',
            animation: 'wave-flow-3 9s linear infinite',
          } as any,
        ]}
      />

      {/* Floating particles */}
      {[
        { size: 6, top: '15%', left: '10%', delay: '0s', dur: '6s' },
        { size: 4, top: '25%', left: '80%', delay: '1s', dur: '8s' },
        { size: 8, top: '55%', left: '25%', delay: '2s', dur: '7s' },
        { size: 5, top: '40%', left: '65%', delay: '3s', dur: '9s' },
        { size: 3, top: '65%', left: '45%', delay: '0.5s', dur: '5s' },
        { size: 7, top: '20%', left: '50%', delay: '4s', dur: '10s' },
      ].map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: 'rgba(59,130,246,0.25)',
            top: p.top,
            left: p.left,
            animation: `particle-float ${p.dur} ease-in-out ${p.delay} infinite`,
          } as any}
        />
      ))}

      {/* Grid overlay with mask fade */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.035) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage:
              'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.4) 70%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.4) 70%, transparent 100%)',
          } as any,
        ]}
      />
    </View>
  );
}

// ─── Exported components ──────────────────────────────────────────────────────

export function HeroBackground() {
  if (Platform.OS !== 'web') return null;
  return <WebWaveBackground />;
}

export function ContentBackground() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage:
              'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)',
            WebkitMaskImage:
              'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)',
          } as any,
        ]}
      />
    </View>
  );
}
