import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { FiPieChart } from '../../utils/iconCompat';

const SUPPORTS_NATIVE_DRIVER = Platform.OS !== 'web';

const arcPath = (cx, cy, outerR, innerR, startAngle, endAngle) => {
  const polar = (radius, angle) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });
  const outerStart = polar(outerR, startAngle);
  const outerEnd = polar(outerR, endAngle);
  const innerEnd = polar(innerR, endAngle);
  const innerStart = polar(innerR, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
};

const PollDonutChart = ({ chartId, segments, totalVotes, isDark }) => {
  const [activeKey, setActiveKey] = useState(segments.find((item) => item.isLeading)?.key || segments[0]?.key || null);
  const entry = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setActiveKey(segments.find((item) => item.isLeading)?.key || segments[0]?.key || null);
  }, [segments]);

  useEffect(() => {
    entry.setValue(0);
    Animated.spring(entry, {
      toValue: 1,
      useNativeDriver: SUPPORTS_NATIVE_DRIVER,
      speed: 12,
      bounciness: 6,
    }).start();
  }, [entry, segments]);

  if (!segments.length || !totalVotes) {
    return (
      <View
        style={[
          styles.emptyState,
          {
            borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#dbe5f0',
            backgroundColor: isDark ? 'rgba(15,23,42,0.48)' : '#f8fafc',
          },
        ]}
      >
        <FiPieChart size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>No votes yet</Text>
        <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
          This chart will animate in as residents start voting.
        </Text>
      </View>
    );
  }

  const total = Math.max(
    1,
    segments.reduce((sum, item) => sum + item.value, 0)
  );
  const safeChartId = String(chartId || 'poll-chart').replace(/[^a-zA-Z0-9_-]/g, '');
  let angle = -Math.PI / 2;
  const arcs = segments.map((item) => {
    const ratio = item.value / total;
    const sweep = ratio * 2 * Math.PI;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;

    return {
      ...item,
      path: arcPath(96, 96, activeKey === item.key ? 82 : 74, 48, startAngle, endAngle),
    };
  });
  const activeSegment = arcs.find((item) => item.key === activeKey) || arcs[0];
  const rotate = entry.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '0deg'],
  });
  const scale = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
        <View style={styles.canvas}>
          <Svg width={192} height={192}>
            <Defs>
              <RadialGradient id={`${safeChartId}-glow`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#7c3aed" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={96} cy={96} r={92} fill={`url(#${safeChartId}-glow)`} />
            {arcs.map((item) => (
              <Path
                key={item.key}
                d={item.path}
                fill={item.color}
                opacity={activeKey && activeKey !== item.key ? 0.38 : 1}
              />
            ))}
          </Svg>
          <View style={styles.center}>
            <Text style={[styles.centerValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {activeSegment?.percentage ?? 0}%
            </Text>
            <Text style={[styles.centerLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {activeSegment?.label || 'Votes'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.legend}>
        {arcs.map((item) => (
          <Pressable
            key={item.key}
            onHoverIn={() => setActiveKey(item.key)}
            onPressIn={() => setActiveKey(item.key)}
            style={[
              styles.legendRow,
              {
                borderColor:
                  activeKey === item.key
                    ? isDark
                      ? 'rgba(96,165,250,0.24)'
                      : '#bfdbfe'
                    : isDark
                      ? 'rgba(148,163,184,0.12)'
                      : '#e2e8f0',
                backgroundColor:
                  activeKey === item.key
                    ? isDark
                      ? 'rgba(37,99,235,0.12)'
                      : '#eff6ff'
                    : isDark
                      ? 'rgba(15,23,42,0.52)'
                      : '#ffffff',
              },
            ]}
          >
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {item.label}
              </Text>
            </View>
            <Text style={[styles.legendValue, { color: isDark ? '#cbd5e1' : '#475569' }]}>
              {item.value} | {item.percentage}%
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  canvas: {
    width: 192,
    height: 192,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  centerValue: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  centerLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legend: {
    gap: 10,
  },
  legendRow: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default memo(PollDonutChart);
