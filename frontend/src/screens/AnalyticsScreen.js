import React, { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SUPPORTS_NATIVE_DRIVER = Platform.OS !== 'web';
const AnimatedPath = Platform.OS === 'web' ? Path : Animated.createAnimatedComponent(Path);
const DAY_MS = 86400000;
const WEEK_MS = DAY_MS * 7;
const LIVE_KEYS = ['issues', 'polls', 'bookings', 'residents'];
const EMPTY = { issues: [], polls: [], bookings: [], residents: [] };
const LOADED = { issues: false, polls: false, bookings: false, residents: false };
const COLORS = {
  live: '#22c55e',
  primary: '#2563eb',
  reported: '#4f46e5',
  resolved: '#10b981',
  pending: '#f59e0b',
  resident: '#0f766e',
  owners: '#7c3aed',
  tenants: '#0284c7',
  totalBar: '#93c5fd',
  resolvedBar: '#2563eb',
  voted: '#7c3aed',
  waiting: '#d8b4fe',
  approved: '#16a34a',
  rejected: '#ef4444',
};
const SHADOW = Platform.select({
  web: { boxShadow: '0px 18px 60px rgba(15, 23, 42, 0.08)' },
  default: { shadowColor: '#020617', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 6 },
});
const WEB_CARD = Platform.OS === 'web'
  ? { transitionDuration: '250ms', transitionProperty: 'all', transitionTimingFunction: 'ease', cursor: 'default', backdropFilter: 'blur(18px)' }
  : {};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const toMs = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};
const statusOf = (value, fallback = '') => String(value || fallback).trim().toLowerCase();
const isResolved = (value) => statusOf(value) === 'resolved';
const categoryOf = (value) => (String(value || 'General').trim().replace(/\s+/g, ' ') || 'General')
  .toLowerCase()
  .split(' ')
  .filter(Boolean)
  .map((part) => part[0].toUpperCase() + part.slice(1))
  .join(' ');
const residentTypeOf = (value) => {
  const normalized = statusOf(value);
  if (normalized === 'owner' || normalized === 'owners') return 'owner';
  if (normalized === 'tenant' || normalized === 'tenants') return 'tenant';
  return null;
};
const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};
const startOfWeek = (value) => {
  const date = new Date(startOfDay(value));
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};
const periodStart = (value, granularity) => (granularity === 'week' ? startOfWeek(value) : startOfDay(value));
const addPeriod = (value, granularity) => value + (granularity === 'week' ? WEEK_MS : DAY_MS);
const bucketLabel = (value, granularity, long = false) => {
  const date = new Date(value);
  if (granularity === 'week') {
    return long
      ? `Week of ${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], long
    ? { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' });
};
const granularityOf = (times) => {
  if (!times.length) return 'day';
  const spanDays = Math.max(1, Math.ceil((Math.max(...times) - Math.min(...times)) / DAY_MS));
  return spanDays > 84 ? 'week' : 'day';
};
const buildBuckets = (times, granularity) => {
  if (!times.length) return [];
  const start = periodStart(Math.min(...times), granularity);
  const end = periodStart(Math.max(...times), granularity);
  const list = [];
  for (let cursor = start; cursor <= end; cursor = addPeriod(cursor, granularity)) {
    list.push({ key: cursor, start: cursor, end: addPeriod(cursor, granularity), label: bucketLabel(cursor, granularity), fullLabel: bucketLabel(cursor, granularity, true) });
  }
  const step = list.length > 8 ? Math.ceil(list.length / 8) : 1;
  return list.map((item, index) => ({ ...item, shortLabel: index % step === 0 ? item.label : '' }));
};
const bucketMapOf = (buckets) => new Map(buckets.map((bucket) => [bucket.start, bucket]));
const smoothPath = (points) => points.reduce((path, point, index) => {
  if (!index) return `M ${point.x} ${point.y}`;
  const prev = points[index - 1];
  const cx = (prev.x + point.x) / 2;
  return `${path} C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
}, '');
const areaPath = (points, bottom) => {
  if (!points.length) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${smoothPath(points)} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
};
const polylineLength = (points) => points.reduce((sum, point, index) => {
  if (!index) return 0;
  const prev = points[index - 1];
  return sum + Math.hypot(point.x - prev.x, point.y - prev.y);
}, 0);
const arcPath = (cx, cy, outerR, innerR, startAngle, endAngle) => {
  const polar = (radius, angle) => ({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  const outerStart = polar(outerR, startAngle);
  const outerEnd = polar(outerR, endAngle);
  const innerEnd = polar(innerR, endAngle);
  const innerStart = polar(innerR, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [`M ${outerStart.x} ${outerStart.y}`, `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`, `L ${innerEnd.x} ${innerEnd.y}`, `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`, 'Z'].join(' ');
};
const compact = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0);
const pct = (value) => `${Math.round(value)}%`;
const issueTime = (issue) => toMs(issue?.createdAt) ?? toMs(issue?.timestamp);
const pollTime = (poll) => toMs(poll?.createdAt);
const bookingTime = (booking) => toMs(booking?.createdAt);
const residentTime = (resident) => toMs(resident?.approvedAt) ?? toMs(resident?.updatedAt) ?? toMs(resident?.createdAt);
const compareWindow = (records, getTime) => {
  const now = Date.now();
  const currentStart = now - (7 * DAY_MS);
  const previousStart = now - (14 * DAY_MS);
  let current = 0;
  let previous = 0;
  records.forEach((record) => {
    const time = getTime(record);
    if (!time) return;
    if (time >= currentStart) current += 1;
    else if (time >= previousStart) previous += 1;
  });
  const delta = current - previous;
  return {
    tone: delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral',
    label: delta === 0 ? 'Flat vs prior 7d' : `${delta > 0 ? '+' : ''}${delta} vs prior 7d`,
  };
};
const useDebouncedValue = (value, delay = 120) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [delay, value]);
  return debounced;
};

const LiveBadge = ({ isDark }) => (
  <View style={[styles.liveBadge, { backgroundColor: isDark ? 'rgba(34,197,94,0.14)' : 'rgba(34,197,94,0.1)', borderColor: isDark ? 'rgba(34,197,94,0.22)' : 'rgba(34,197,94,0.16)' }]}>
    <View style={styles.liveDot} />
    <Text style={[styles.liveText, { color: isDark ? '#bbf7d0' : '#166534' }]}>Live</Text>
  </View>
);

const InlineEmpty = ({ message, isDark }) => (
  <View style={[styles.inlineEmpty, { backgroundColor: isDark ? 'rgba(15,23,42,0.45)' : '#f8fafc', borderColor: isDark ? 'rgba(148,163,184,0.08)' : '#e2e8f0' }]}>
    <Text style={[styles.inlineEmptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{message}</Text>
  </View>
);

const MetricCard = ({ title, value, meta, trend, accent, isDark, width }) => (
  <Pressable style={({ hovered, pressed }) => [styles.metricCard, SHADOW, WEB_CARD, { width, borderColor: isDark ? 'rgba(148,163,184,0.1)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(11,18,32,0.92)' : 'rgba(255,255,255,0.94)', transform: [{ translateY: hovered ? -5 : pressed ? 1 : 0 }] }]}>
    <View style={[styles.metricAccent, { backgroundColor: accent }]} />
    <View style={styles.metricHeader}>
      <Text style={[styles.metricTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{title}</Text>
      {trend ? (
        <View style={[styles.trendPill, { backgroundColor: trend.tone === 'positive' ? 'rgba(34,197,94,0.14)' : trend.tone === 'negative' ? 'rgba(239,68,68,0.12)' : (isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0') }]}>
          <Text style={[styles.trendText, { color: trend.tone === 'positive' ? '#16a34a' : trend.tone === 'negative' ? '#dc2626' : (isDark ? '#cbd5e1' : '#475569') }]}>{trend.label}</Text>
        </View>
      ) : null}
    </View>
    <Text style={[styles.metricValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{value}</Text>
    <Text style={[styles.metricMeta, { color: isDark ? '#cbd5e1' : '#475569' }]}>{meta}</Text>
  </Pressable>
);

const ChartCard = ({ title, subtitle, isDark, headerRight, children }) => (
  <Pressable style={({ hovered }) => [styles.chartCard, SHADOW, WEB_CARD, { borderColor: isDark ? 'rgba(148,163,184,0.1)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(11,18,32,0.92)' : 'rgba(255,255,255,0.94)', transform: [{ translateY: hovered ? -5 : 0 }] }]}>
    <View style={styles.chartHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.chartTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{title}</Text>
        {subtitle ? <Text style={[styles.chartSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{subtitle}</Text> : null}
      </View>
      {headerRight}
    </View>
    {children}
  </Pressable>
);

const ChartLegend = ({ items, isDark }) => (
  <View style={styles.legendRow}>
    {items.map((item) => (
      <View key={item.key} style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
        <Text style={[styles.legendText, { color: isDark ? '#cbd5e1' : '#475569' }]}>{item.label}</Text>
      </View>
    ))}
  </View>
);

const ChartTooltip = ({ title, rows, left, top, isDark }) => (
  <View style={[styles.tooltip, { left, top, borderColor: isDark ? 'rgba(148,163,184,0.16)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(7,12,24,0.96)' : 'rgba(255,255,255,0.98)' }]}>
    <Text style={[styles.tooltipTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{title}</Text>
    {rows.map((row) => (
      <View key={row.label} style={styles.tooltipRow}>
        <View style={[styles.tooltipDot, { backgroundColor: row.color }]} />
        <Text style={[styles.tooltipLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>{row.label}</Text>
        <Text style={[styles.tooltipValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{row.value}</Text>
      </View>
    ))}
  </View>
);

const LineChart = ({ chartId, data, series, height = 320, isDark }) => {
  const [activeIndex, setActiveIndex] = useState(data.length ? data.length - 1 : null);
  const [cursorX, setCursorX] = useState(null);
  const [chartWidth, setChartWidth] = useState(0);
  const draw = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => { setActiveIndex(data.length ? data.length - 1 : null); }, [data]);
  const signature = useMemo(() => data.map((item) => `${item.key}:${series.map((entry) => item[entry.key] || 0).join('-')}`).join('|'), [data, series]);
  useEffect(() => {
    draw.setValue(0);
    fade.setValue(0);
    Animated.parallel([
      Animated.timing(draw, { toValue: 1, duration: 760, useNativeDriver: false }),
      Animated.timing(fade, { toValue: 1, duration: 360, useNativeDriver: SUPPORTS_NATIVE_DRIVER }),
    ]).start();
  }, [draw, fade, signature]);

  if (!data.length) return <InlineEmpty message="Timeline data will appear as activity comes in." isDark={isDark} />;

  const padding = { top: 24, right: 18, bottom: 34, left: 22 };
  const width = Math.max(chartWidth, 280);
  const plotWidth = Math.max(width - padding.left - padding.right, 1);
  const plotHeight = Math.max(height - padding.top - padding.bottom, 1);
  const maxValue = Math.max(1, ...data.flatMap((item) => series.map((entry) => item[entry.key] || 0)));
  const prepared = series.map((entry) => {
    const points = data.map((item, index) => ({
      x: padding.left + (data.length === 1 ? plotWidth / 2 : (plotWidth * index) / (data.length - 1)),
      y: padding.top + plotHeight - (((item[entry.key] || 0) / maxValue) * plotHeight),
    }));
    return { ...entry, points, length: Math.max(polylineLength(points), 1) };
  });
  const xRanges = data.map((_, index) => {
    const current = prepared[0]?.points[index];
    const prev = prepared[0]?.points[index - 1];
    const next = prepared[0]?.points[index + 1];
    const left = index === 0 ? padding.left : (prev.x + current.x) / 2;
    const right = index === data.length - 1 ? padding.left + plotWidth : (current.x + next.x) / 2;
    return { left, width: right - left, center: current.x };
  });
  const defaultIndex = data.length - 1;
  const activeLineX = activeIndex !== null ? prepared[0]?.points[activeIndex]?.x : null;
  const highestY = activeIndex !== null ? Math.min(...prepared.map((entry) => entry.points[activeIndex]?.y || (padding.top + plotHeight))) : padding.top;
  const tooltipLeft = clamp((cursorX ?? activeLineX ?? padding.left) - 84, 8, Math.max(width - 172, 8));
  const tooltipTop = clamp(highestY - 110, 6, Math.max(height - 122, 6));
  const rows = activeIndex !== null ? series.map((entry) => ({ label: entry.label, value: data[activeIndex]?.[entry.key] || 0, color: entry.color })) : [];
  const ticks = [1, 0.75, 0.5, 0.25].map((ratio) => ({ y: padding.top + (1 - ratio) * plotHeight, value: Math.round(maxValue * ratio) }));
  const translateY = fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <View style={styles.lineChartWrap} onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}>
      <ChartLegend items={series} isDark={isDark} />
      <View style={[styles.chartCanvas, { height }]}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY }] }}>
          <Svg width={width} height={height}>
            <Defs>
              {series.map((entry) => (
                <LinearGradient key={entry.key} id={`${chartId}-${entry.key}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={entry.color} stopOpacity="0.32" />
                  <Stop offset="70%" stopColor={entry.color} stopOpacity="0.08" />
                  <Stop offset="100%" stopColor={entry.color} stopOpacity="0" />
                </LinearGradient>
              ))}
              {series.map((entry) => (
                <RadialGradient key={`${entry.key}-glow`} id={`${chartId}-${entry.key}-glow`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={entry.color} stopOpacity="0.58" />
                  <Stop offset="100%" stopColor={entry.color} stopOpacity="0" />
                </RadialGradient>
              ))}
            </Defs>
            {ticks.map((tick, index) => (
              <G key={`tick-${index}`}>
                <Line x1={padding.left} x2={padding.left + plotWidth} y1={tick.y} y2={tick.y} stroke={isDark ? 'rgba(148,163,184,0.1)' : 'rgba(148,163,184,0.22)'} strokeDasharray="4 5" strokeWidth="1" />
                <SvgText x={padding.left} y={tick.y - 6} fill={isDark ? '#475569' : '#94a3b8'} fontSize="10" fontWeight="700">{tick.value}</SvgText>
              </G>
            ))}
            {activeLineX !== null ? <Line x1={activeLineX} x2={activeLineX} y1={padding.top} y2={padding.top + plotHeight} stroke={isDark ? 'rgba(148,163,184,0.22)' : 'rgba(100,116,139,0.18)'} strokeDasharray="4 4" strokeWidth="1.5" /> : null}
            {prepared.map((entry) => <Path key={`${entry.key}-area`} d={areaPath(entry.points, padding.top + plotHeight)} fill={`url(#${chartId}-${entry.key}-fill)`} />)}
            {prepared.map((entry) => (
              <AnimatedPath key={`${entry.key}-line`} d={smoothPath(entry.points)} fill="none" stroke={entry.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${entry.length} ${entry.length}`} strokeDashoffset={Platform.OS === 'web' ? 0 : draw.interpolate({ inputRange: [0, 1], outputRange: [entry.length, 0] })} />
            ))}
            {prepared.map((entry) => (
              <G key={`${entry.key}-dots`}>
                {entry.points.map((point, index) => (
                  <G key={`${entry.key}-${data[index]?.key || index}`}>
                    {activeIndex === index ? <Circle cx={point.x} cy={point.y} r={16} fill={`url(#${chartId}-${entry.key}-glow)`} /> : null}
                    <Circle cx={point.x} cy={point.y} r={activeIndex === index ? 5.5 : 3.5} fill={entry.color} stroke={isDark ? '#08101c' : '#ffffff'} strokeWidth="2" />
                  </G>
                ))}
              </G>
            ))}
          </Svg>
        </Animated.View>
        <View style={StyleSheet.absoluteFill}>
          {xRanges.map((range, index) => (
            <Pressable key={data[index]?.key || index} onHoverIn={() => { setActiveIndex(index); setCursorX(range.center); }} onHoverOut={() => { setActiveIndex(defaultIndex); setCursorX(null); }} onPressIn={() => { setActiveIndex(index); setCursorX(range.center); }} onPressOut={() => { setActiveIndex(index); setCursorX(range.center); }} onMouseMove={(event) => setCursorX(range.left + event.nativeEvent.locationX)} style={[styles.chartHit, { left: range.left, top: padding.top, width: range.width, height: plotHeight }]} />
          ))}
        </View>
        {activeIndex !== null ? <ChartTooltip title={data[activeIndex]?.fullLabel || data[activeIndex]?.label} rows={rows} left={tooltipLeft} top={tooltipTop} isDark={isDark} /> : null}
      </View>
      <View style={styles.axisLabels}>
        {data.map((item) => <Text key={item.key} style={[styles.axisLabel, { color: isDark ? '#475569' : '#94a3b8' }]}>{item.shortLabel}</Text>)}
      </View>
    </View>
  );
};

const CategoryRow = ({ item, maxValue, isDark }) => {
  const totalWidth = useRef(new Animated.Value(0)).current;
  const resolvedWidth = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    if (!trackWidth) return;
    Animated.parallel([
      Animated.timing(totalWidth, { toValue: trackWidth * (item.total / maxValue), duration: 650, useNativeDriver: false }),
      Animated.timing(resolvedWidth, { toValue: trackWidth * (item.resolved / maxValue), duration: 650, useNativeDriver: false }),
    ]).start();
  }, [item.resolved, item.total, maxValue, resolvedWidth, totalWidth, trackWidth]);
  return (
    <View style={[styles.categoryRow, { borderColor: isDark ? 'rgba(148,163,184,0.1)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(15,23,42,0.52)' : '#f8fafc' }]}>
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{item.label}</Text>
        <Text style={[styles.categoryMeta, { color: isDark ? '#94a3b8' : '#64748b' }]}>{item.total} total · {item.total ? Math.round((item.resolved / item.total) * 100) : 0}% resolved</Text>
      </View>
      <View style={[styles.categoryTrack, { backgroundColor: isDark ? 'rgba(148,163,184,0.1)' : '#e2e8f0' }]} onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
        <Animated.View style={[styles.categoryBarTotal, { width: totalWidth }]} />
        <Animated.View style={[styles.categoryBarResolved, { width: resolvedWidth }]} />
      </View>
    </View>
  );
};

const CategoryChart = ({ data, isDark }) => {
  if (!data.length) return <InlineEmpty message="Issue categories will appear once issues are created." isDark={isDark} />;
  const maxValue = Math.max(1, ...data.map((item) => item.total));
  return (
    <View style={styles.categoryWrap}>
      <ChartLegend items={[{ key: 'total', label: 'Total issues', color: COLORS.totalBar }, { key: 'resolved', label: 'Resolved', color: COLORS.resolvedBar }]} isDark={isDark} />
      <View style={styles.categoryList}>
        {data.map((item) => <CategoryRow key={item.key} item={item} maxValue={maxValue} isDark={isDark} />)}
      </View>
    </View>
  );
};

const DonutChart = ({ segments, centerValue, centerLabel, footer, isDark }) => {
  const [activeKey, setActiveKey] = useState(segments[0]?.key || null);
  const entry = useRef(new Animated.Value(0)).current;
  useEffect(() => { setActiveKey(segments[0]?.key || null); }, [segments]);
  const signature = useMemo(() => segments.map((item) => `${item.key}:${item.value}`).join('|'), [segments]);
  useEffect(() => {
    entry.setValue(0);
    Animated.spring(entry, { toValue: 1, useNativeDriver: SUPPORTS_NATIVE_DRIVER, speed: 12, bounciness: 6 }).start();
  }, [entry, signature]);

  if (!segments.length) return <InlineEmpty message="Participation appears once polls and approved residents are available." isDark={isDark} />;

  const total = Math.max(segments.reduce((sum, item) => sum + item.value, 0), 1);
  let angle = -Math.PI / 2;
  const arcs = segments.map((item) => {
    const ratio = item.value / total;
    const sweep = ratio * 2 * Math.PI;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;
    return { ...item, percentage: Math.round(ratio * 100), path: arcPath(118, 118, activeKey === item.key ? 94 : 86, 58, startAngle, endAngle) };
  });
  const active = arcs.find((item) => item.key === activeKey) || arcs[0];
  const rotate = entry.interpolate({ inputRange: [0, 1], outputRange: ['-24deg', '0deg'] });
  const scale = entry.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const opacity = entry.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={styles.donutWrap}>
      <Animated.View style={{ opacity, transform: [{ rotate }, { scale }] }}>
        <View style={styles.donutCanvas}>
          <Svg width={236} height={236}>
            <Defs>
              <RadialGradient id="analytics-donut-glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#7c3aed" stopOpacity="0.14" />
                <Stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={118} cy={118} r={114} fill="url(#analytics-donut-glow)" />
            {arcs.map((item) => <Path key={item.key} d={item.path} fill={item.color} opacity={activeKey && activeKey !== item.key ? 0.42 : 1} />)}
          </Svg>
          <View style={styles.donutCenter}>
            <Text style={[styles.donutValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{active?.percentage ?? centerValue}%</Text>
            <Text style={[styles.donutLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>{active?.centerLabel || centerLabel}</Text>
          </View>
        </View>
      </Animated.View>
      <View style={styles.donutLegend}>
        {arcs.map((item) => (
          <Pressable key={item.key} onHoverIn={() => setActiveKey(item.key)} onPressIn={() => setActiveKey(item.key)} style={[styles.donutLegendRow, { borderColor: activeKey === item.key ? (isDark ? 'rgba(124,58,237,0.3)' : '#ddd6fe') : (isDark ? 'rgba(148,163,184,0.1)' : '#e2e8f0'), backgroundColor: activeKey === item.key ? (isDark ? 'rgba(124,58,237,0.08)' : '#f5f3ff') : (isDark ? 'rgba(15,23,42,0.52)' : '#f8fafc') }]}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{item.label}</Text>
            </View>
            <Text style={[styles.donutLegendValue, { color: isDark ? '#cbd5e1' : '#475569' }]}>{item.value} · {item.percentage}%</Text>
          </Pressable>
        ))}
      </View>
      {footer ? <Text style={[styles.donutFooter, { color: isDark ? '#94a3b8' : '#64748b' }]}>{footer}</Text> : null}
    </View>
  );
};

const BookingRow = ({ label, count, ratio, color, isDark }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  useEffect(() => {
    if (!trackWidth) return;
    Animated.parallel([
      Animated.timing(widthAnim, { toValue: trackWidth * ratio, duration: 700, useNativeDriver: false }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  }, [opacityAnim, ratio, trackWidth, widthAnim]);
  return (
    <View style={styles.bookingRow}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingLabelWrap}>
          <View style={[styles.bookingDot, { backgroundColor: color }]} />
          <Text style={[styles.bookingLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{label}</Text>
        </View>
        <Text style={[styles.bookingValue, { color }]}>{count}</Text>
      </View>
      <View style={[styles.bookingTrack, { backgroundColor: isDark ? 'rgba(148,163,184,0.1)' : '#e2e8f0' }]} onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
        <Animated.View style={[styles.bookingFill, { width: widthAnim, opacity: opacityAnim, backgroundColor: color }]} />
        <Animated.View style={[styles.bookingGlow, { width: widthAnim, opacity: opacityAnim }]} />
      </View>
      <Text style={[styles.bookingPct, { color: isDark ? '#94a3b8' : '#64748b' }]}>{pct(ratio * 100)} of all bookings</Text>
    </View>
  );
};

export default function AnalyticsScreen() {
  const { userData } = useAuth();
  const { isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [wrapWidth, setWrapWidth] = useState(0);
  const [loadedState, setLoadedState] = useState(LOADED);
  const [sources, setSources] = useState(EMPTY);

  useEffect(() => {
    if (!userData?.societyId) {
      startTransition(() => {
        setSources(EMPTY);
        setLoadedState({ issues: true, polls: true, bookings: true, residents: true });
      });
      return undefined;
    }
    startTransition(() => {
      setSources(EMPTY);
      setLoadedState(LOADED);
    });
    const updateSource = (key, next) => {
      startTransition(() => {
        setSources((prev) => ({ ...prev, [key]: next }));
        setLoadedState((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
      });
    };
    const onError = (key, error) => {
      console.error(`[AnalyticsScreen] ${key} listener failed:`, error);
      updateSource(key, []);
    };
    const unsubscribers = [
      onSnapshot(query(collection(db, 'issues'), where('societyId', '==', userData.societyId)), (snapshot) => updateSource('issues', snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))), (error) => onError('issues', error)),
      onSnapshot(query(collection(db, 'polls'), where('societyId', '==', userData.societyId)), (snapshot) => updateSource('polls', snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))), (error) => onError('polls', error)),
      onSnapshot(collection(db, 'bookings', userData.societyId, 'entries'), (snapshot) => updateSource('bookings', snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))), (error) => onError('bookings', error)),
      onSnapshot(query(collection(db, 'users'), where('societyId', '==', userData.societyId)), (snapshot) => updateSource('residents', snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))), (error) => onError('residents', error)),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe && unsubscribe());
  }, [userData?.societyId]);

  const deferredSources = useDeferredValue(sources);
  const stableSources = useDebouncedValue(deferredSources, 120);
  const loaded = LIVE_KEYS.every((key) => loadedState[key]);
  const width = Math.max(wrapWidth || (windowWidth > 1180 ? windowWidth - 336 : windowWidth - 28), 320);
  const isMobile = width < 760;
  const isDesktop = width >= 1080;
  const gap = isMobile ? 14 : 20;
  const pad = isMobile ? 12 : 20;
  const statColumns = isMobile ? 1 : width < 980 ? 2 : 4;
  const statWidth = (width - gap * (statColumns - 1)) / statColumns;
  const mainWidth = isDesktop ? (width - gap) * 0.62 : width;
  const sideWidth = isDesktop ? width - mainWidth - gap : width;

  const analytics = useMemo(() => {
    const issues = stableSources.issues || [];
    const polls = stableSources.polls || [];
    const bookings = stableSources.bookings || [];
    const residents = stableSources.residents || [];
    const approvedResidents = residents.filter((item) => item?.role === 'resident' && statusOf(item?.status) === 'approved');
    const approvedMembers = residents.filter((item) => statusOf(item?.status) === 'approved' && item?.role !== 'super_admin');
    const totalIssues = issues.length;
    const resolvedIssues = issues.filter((item) => isResolved(item?.status)).length;
    const pendingIssues = Math.max(totalIssues - resolvedIssues, 0);
    const resolvedRate = totalIssues ? Math.round((resolvedIssues / totalIssues) * 100) : 0;
    const bookingCounts = bookings.reduce((acc, item) => {
      const key = statusOf(item?.status, 'pending');
      if (key === 'approved') acc.approved += 1;
      else if (key === 'rejected') acc.rejected += 1;
      else acc.pending += 1;
      return acc;
    }, { approved: 0, pending: 0, rejected: 0 });
    const totalBookings = bookings.length;
    const bookingApprovalRate = totalBookings ? Math.round((bookingCounts.approved / totalBookings) * 100) : 0;
    const uniqueVoters = new Set();
    polls.forEach((poll) => Object.keys(poll?.votes || {}).forEach((uid) => uniqueVoters.add(uid)));
    const participationBase = approvedResidents.length || approvedMembers.length;
    const participationCount = uniqueVoters.size;
    const participationPct = participationBase ? Math.round((participationCount / participationBase) * 100) : 0;

    const issueTimes = issues.map(issueTime).filter(Boolean);
    const issueGranularity = granularityOf(issueTimes);
    const issueBuckets = buildBuckets(issueTimes, issueGranularity).map((bucket) => ({ ...bucket, reported: 0, resolved: 0, pending: 0 }));
    const issueByBucket = bucketMapOf(issueBuckets);
    issues.forEach((item) => {
      const time = issueTime(item);
      if (!time) return;
      const bucket = issueByBucket.get(periodStart(time, issueGranularity));
      if (!bucket) return;
      bucket.reported += 1;
      if (isResolved(item?.status)) bucket.resolved += 1;
      else bucket.pending += 1;
    });

    const residentTimes = approvedResidents.map(residentTime).filter(Boolean);
    const residentGranularity = granularityOf(residentTimes);
    const residentBuckets = buildBuckets(residentTimes, residentGranularity).map((bucket) => ({ ...bucket, total: 0, owners: 0, tenants: 0 }));
    const residentsByBucket = bucketMapOf(residentBuckets);
    approvedResidents.forEach((item) => {
      const time = residentTime(item);
      if (!time) return;
      const bucket = residentsByBucket.get(periodStart(time, residentGranularity));
      if (!bucket) return;
      bucket.total += 1;
      const residentType = residentTypeOf(item?.residentType);
      if (residentType === 'owner') bucket.owners += 1;
      if (residentType === 'tenant') bucket.tenants += 1;
    });
    let runningTotal = 0;
    let runningOwners = 0;
    let runningTenants = 0;
    const residentTrend = residentBuckets.map((bucket) => {
      runningTotal += bucket.total;
      runningOwners += bucket.owners;
      runningTenants += bucket.tenants;
      return { key: bucket.key, label: bucket.label, shortLabel: bucket.shortLabel, fullLabel: bucket.fullLabel, total: runningTotal, owners: runningOwners, tenants: runningTenants };
    });
    const typedResidents = approvedResidents.some((item) => residentTypeOf(item?.residentType));
    const residentSeries = typedResidents
      ? [{ key: 'total', label: 'Total residents', color: COLORS.resident }, { key: 'owners', label: 'Owners', color: COLORS.owners }, { key: 'tenants', label: 'Tenants', color: COLORS.tenants }]
      : [{ key: 'total', label: 'Total residents', color: COLORS.resident }];
    const categories = Object.values(issues.reduce((acc, item) => {
      const label = categoryOf(item?.category);
      if (!acc[label]) acc[label] = { key: label.toLowerCase().replace(/\s+/g, '-'), label, total: 0, resolved: 0 };
      acc[label].total += 1;
      if (isResolved(item?.status)) acc[label].resolved += 1;
      return acc;
    }, {})).sort((a, b) => b.total - a.total).slice(0, 6);

    return {
      totalIssues,
      resolvedIssues,
      pendingIssues,
      resolvedRate,
      totalPolls: polls.length,
      totalBookings,
      bookingCounts,
      bookingApprovalRate,
      totalResidents: approvedResidents.length,
      issueGranularity,
      issueTrend: issueBuckets.map((bucket) => ({ key: bucket.key, label: bucket.label, shortLabel: bucket.shortLabel, fullLabel: bucket.fullLabel, reported: bucket.reported, resolved: bucket.resolved, pending: bucket.pending })),
      residentGranularity,
      residentTrend,
      residentSeries,
      typedResidents,
      categories,
      donutSegments: participationBase ? [{ key: 'participated', label: 'Participated', value: participationCount, color: COLORS.voted, centerLabel: 'Participation' }, { key: 'remaining', label: 'Not yet', value: Math.max(participationBase - participationCount, 0), color: COLORS.waiting, centerLabel: 'Not voted' }] : [],
      participationBase,
      participationCount,
      participationPct,
      issueTrendDelta: compareWindow(issues, issueTime),
      resolvedTrendDelta: compareWindow(issues.filter((item) => isResolved(item?.status)), issueTime),
      pollTrendDelta: compareWindow(polls, pollTime),
      bookingTrendDelta: compareWindow(bookings, bookingTime),
    };
  }, [stableSources]);

  const isEmpty = loaded && analytics.totalIssues === 0 && analytics.totalPolls === 0 && analytics.totalBookings === 0 && analytics.totalResidents === 0;
  const issueSeries = useMemo(() => [{ key: 'reported', label: 'Reported', color: COLORS.reported }, { key: 'resolved', label: 'Resolved', color: COLORS.resolved }, { key: 'pending', label: 'Pending', color: COLORS.pending }], []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#07111f' : '#f3f7fb' }]} contentContainerStyle={{ padding: pad, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
      <View style={styles.backgroundOrbs}>
        <View style={[styles.orb, styles.orbPrimary, { opacity: isDark ? 0.24 : 0.42 }]} />
        <View style={[styles.orb, styles.orbSecondary, { opacity: isDark ? 0.18 : 0.28 }]} />
      </View>
      <View style={styles.shell} onLayout={(event) => setWrapWidth(event.nativeEvent.layout.width)}>
        {!loaded ? (
          <View style={[styles.centerCard, SHADOW, { borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(11,18,32,0.9)' : 'rgba(255,255,255,0.94)' }]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={[styles.centerText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Syncing live analytics...</Text>
          </View>
        ) : isEmpty ? (
          <View style={[styles.centerCard, SHADOW, { borderColor: isDark ? 'rgba(148,163,184,0.12)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(11,18,32,0.9)' : 'rgba(255,255,255,0.94)' }]}>
            <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>No analytics yet</Text>
            <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>This dashboard updates automatically as issues, bookings, polls, and approved residents start coming in.</Text>
          </View>
        ) : (
          <>
            <View style={styles.topBar}>
              <View style={{ flex: 1 }}>
                <View style={styles.headingRow}>
                  <Text style={[styles.pageHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Analytics</Text>
                  <LiveBadge isDark={isDark} />
                </View>
                <Text style={[styles.pageSubheading, { color: isDark ? '#94a3b8' : '#64748b' }]}>Full-history admin insights from live Firestore data.</Text>
              </View>
            </View>
            <View style={[styles.metricsRow, { gap }]}>
              <MetricCard title="Total Issues" value={compact(analytics.totalIssues)} meta={`${analytics.pendingIssues} unresolved issues`} trend={analytics.issueTrendDelta} accent={COLORS.reported} isDark={isDark} width={statWidth} />
              <MetricCard title="Resolved Rate" value={pct(analytics.resolvedRate)} meta={`${analytics.resolvedIssues} of ${analytics.totalIssues} issues resolved`} trend={analytics.resolvedTrendDelta} accent={COLORS.resolved} isDark={isDark} width={statWidth} />
              <MetricCard title="Total Polls" value={compact(analytics.totalPolls)} meta={`${analytics.participationPct}% participation across residents`} trend={analytics.pollTrendDelta} accent={COLORS.voted} isDark={isDark} width={statWidth} />
              <MetricCard title="Total Bookings" value={compact(analytics.totalBookings)} meta={`${analytics.bookingApprovalRate}% approved`} trend={analytics.bookingTrendDelta} accent={COLORS.primary} isDark={isDark} width={statWidth} />
            </View>
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap, alignItems: 'flex-start' }}>
              <View style={{ width: mainWidth, gap }}>
                <ChartCard title="Issue Timeline" subtitle={`Full history grouped by ${analytics.issueGranularity}. Reported issues are split by current status.`} isDark={isDark}>
                  {analytics.issueTrend.length ? <LineChart chartId="issue-timeline" data={analytics.issueTrend} series={issueSeries} height={320} isDark={isDark} /> : <InlineEmpty message="Issue history will show up here once the first issue is reported." isDark={isDark} />}
                </ChartCard>
                <ChartCard title="Issue Categories" subtitle="Top categories ranked by total issue volume." isDark={isDark}>
                  <CategoryChart data={analytics.categories} isDark={isDark} />
                </ChartCard>
                <ChartCard title="Booking Insights" subtitle="Live status mix across every booking record." isDark={isDark} headerRight={<Text style={[styles.chartHeaderValue, { color: isDark ? '#cbd5e1' : '#475569' }]}>{analytics.totalBookings} total</Text>}>
                  {analytics.totalBookings ? (
                    <View style={styles.bookingGrid}>
                      <BookingRow label="Approved" count={analytics.bookingCounts.approved} ratio={analytics.totalBookings ? analytics.bookingCounts.approved / analytics.totalBookings : 0} color={COLORS.approved} isDark={isDark} />
                      <BookingRow label="Pending" count={analytics.bookingCounts.pending} ratio={analytics.totalBookings ? analytics.bookingCounts.pending / analytics.totalBookings : 0} color={COLORS.pending} isDark={isDark} />
                      <BookingRow label="Rejected" count={analytics.bookingCounts.rejected} ratio={analytics.totalBookings ? analytics.bookingCounts.rejected / analytics.totalBookings : 0} color={COLORS.rejected} isDark={isDark} />
                    </View>
                  ) : <InlineEmpty message="Bookings will animate in here once residents start reserving facilities." isDark={isDark} />}
                </ChartCard>
              </View>
              <View style={{ width: sideWidth, gap }}>
                <ChartCard title="Resident Growth Over Time" subtitle={`Cumulative approved residents grouped by ${analytics.residentGranularity}.`} isDark={isDark} headerRight={<Text style={[styles.chartHeaderValue, { color: isDark ? '#cbd5e1' : '#475569' }]}>{analytics.totalResidents} residents</Text>}>
                  {analytics.residentTrend.length ? <LineChart chartId="resident-growth" data={analytics.residentTrend} series={analytics.residentSeries} height={280} isDark={isDark} /> : <InlineEmpty message="Approved residents will build a cumulative growth curve here." isDark={isDark} />}
                </ChartCard>
                <ChartCard title="Poll Participation" subtitle="Residents who have voted in at least one poll." isDark={isDark}>
                  <DonutChart segments={analytics.donutSegments} centerValue={analytics.participationPct} centerLabel="Participation" footer={analytics.participationBase ? `${analytics.participationCount} of ${analytics.participationBase} residents participated` : 'Participation needs approved residents and poll votes'} isDark={isDark} />
                </ChartCard>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  shell: { width: '100%', maxWidth: 1440, alignSelf: 'center', gap: 20 },
  backgroundOrbs: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  orb: { position: 'absolute', borderRadius: 999 },
  orbPrimary: { width: 320, height: 320, right: -80, top: -40, backgroundColor: '#bfdbfe' },
  orbSecondary: { width: 260, height: 260, left: -70, top: 180, backgroundColor: '#ddd6fe' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  pageHeading: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  pageSubheading: { marginTop: 6, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  liveDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.live },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  metricCard: { minHeight: 152, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 18, borderWidth: 1, overflow: 'hidden' },
  metricAccent: { position: 'absolute', left: 0, right: 0, top: 0, height: 4 },
  metricHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  metricTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  trendPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  trendText: { fontSize: 10, fontWeight: '800' },
  metricValue: { marginTop: 18, fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
  metricMeta: { marginTop: 10, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  chartCard: { width: '100%', borderWidth: 1, borderRadius: 22, padding: 20 },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  chartSubtitle: { marginTop: 4, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  chartHeaderValue: { fontSize: 12, fontWeight: '800' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendSwatch: { width: 9, height: 9, borderRadius: 999 },
  legendText: { fontSize: 12, fontWeight: '700' },
  lineChartWrap: { width: '100%' },
  chartCanvas: { width: '100%', position: 'relative' },
  chartHit: { position: 'absolute' },
  axisLabels: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  axisLabel: { flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  tooltip: {
    position: 'absolute',
    minWidth: 156,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    pointerEvents: 'none',
    ...Platform.select({
      web: { boxShadow: '0 14px 44px rgba(15,23,42,0.18)' },
      default: { shadowColor: '#020617', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
    }),
  },
  tooltipTitle: { fontSize: 12, fontWeight: '900', marginBottom: 8 },
  tooltipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  tooltipDot: { width: 7, height: 7, borderRadius: 999, marginRight: 8 },
  tooltipLabel: { flex: 1, fontSize: 12, fontWeight: '600' },
  tooltipValue: { fontSize: 12, fontWeight: '900' },
  categoryWrap: { width: '100%' },
  categoryList: { gap: 12 },
  categoryRow: { borderRadius: 16, borderWidth: 1, padding: 14 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  categoryTitle: { flex: 1, fontSize: 13, fontWeight: '800' },
  categoryMeta: { fontSize: 11, fontWeight: '700' },
  categoryTrack: { height: 20, borderRadius: 999, overflow: 'hidden', position: 'relative' },
  categoryBarTotal: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 999, backgroundColor: COLORS.totalBar, opacity: 0.55 },
  categoryBarResolved: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 999, backgroundColor: COLORS.resolvedBar },
  donutWrap: { alignItems: 'center' },
  donutCanvas: { width: 236, height: 236, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutValue: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  donutLabel: { marginTop: 4, fontSize: 11, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6 },
  donutLegend: { width: '100%', marginTop: 16, gap: 8 },
  donutLegendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  donutLegendValue: { fontSize: 12, fontWeight: '800' },
  donutFooter: { marginTop: 14, fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },
  bookingGrid: { gap: 20 },
  bookingRow: { gap: 8 },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookingLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookingDot: { width: 9, height: 9, borderRadius: 999 },
  bookingLabel: { fontSize: 13, fontWeight: '800' },
  bookingValue: { fontSize: 12, fontWeight: '900' },
  bookingTrack: { height: 12, borderRadius: 999, overflow: 'hidden', position: 'relative' },
  bookingFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999 },
  bookingGlow: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.28)' },
  bookingPct: { fontSize: 11, fontWeight: '700' },
  centerCard: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 24, paddingVertical: 54, alignItems: 'center', justifyContent: 'center' },
  centerText: { marginTop: 14, fontSize: 13, fontWeight: '700' },
  emptyTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  emptyText: { marginTop: 10, maxWidth: 560, fontSize: 14, lineHeight: 22, textAlign: 'center', fontWeight: '600' },
  inlineEmpty: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  inlineEmptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center', fontWeight: '600' },
});
