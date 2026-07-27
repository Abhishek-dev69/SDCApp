import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';

export default function PerformanceChart({ tests }) {
  // Sort tests by date ascending and take latest 6 graded tests
  const sortedTests = [...tests]
    .filter(t => t.score !== null)
    .sort((a, b) => new Date(a.due_at || a.created_at) - new Date(b.due_at || b.created_at))
    .slice(-6);

  if (sortedTests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No test performance data available yet.</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - 32; // padding container
  const chartHeight = 180;
  const paddingX = 35;
  const paddingY = 30;

  const points = sortedTests.map((t, index) => {
    const x = paddingX + (index * (screenWidth - paddingX * 2)) / Math.max(1, sortedTests.length - 1);
    // Percentage score (e.g. 80%)
    const pct = t.total_marks > 0 ? (t.score / t.total_marks) * 100 : 0;
    const y = chartHeight - paddingY - (pct * (chartHeight - paddingY * 2)) / 100;
    return { x, y, score: Math.round(pct), subject: t.subject };
  });

  // Construct SVG bezier path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }
  }

  // Construct SVG fill path (closes the shape at the bottom)
  let fillD = '';
  if (points.length > 0) {
    fillD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>Academic Progress Trend</Text>
      <View style={styles.chartWrapper}>
        <Svg width={screenWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="gradientLine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#2b58ed" />
              <Stop offset="100%" stopColor="#6366f1" />
            </LinearGradient>
            <LinearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#2b58ed" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#2b58ed" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid lines (Y axis thresholds at 50% and 100%) */}
          <Line x1={paddingX} y1={paddingY} x2={screenWidth - paddingX} y2={paddingY} stroke="#f1f5f9" strokeWidth="2" />
          <Line x1={paddingX} y1={chartHeight / 2} x2={screenWidth - paddingX} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1={paddingX} y1={chartHeight - paddingY} x2={screenWidth - paddingX} y2={chartHeight - paddingY} stroke="#e2e8f0" strokeWidth="2" />

          {/* Fill Area */}
          {fillD ? <Path d={fillD} fill="url(#gradientFill)" /> : null}

          {/* Line Path */}
          {pathD ? <Path d={pathD} fill="none" stroke="url(#gradientLine)" strokeWidth="3" /> : null}

          {/* Points & Tooltips */}
          {points.map((pt, idx) => (
            <React.Fragment key={idx}>
              <Circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#2b58ed" strokeWidth="3" />
              <SvgText
                x={pt.x}
                y={pt.y - 12}
                fontSize="10"
                fontWeight="bold"
                fill="#1e293b"
                textAnchor="middle"
              >
                {pt.score}%
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>

        {/* Labels below chart */}
        <View style={styles.labelsContainer}>
          {points.map((pt, idx) => (
            <View key={idx} style={[styles.labelWrapper, { width: (screenWidth - paddingX * 2) / points.length }]}>
              <Text style={styles.labelText} numberOfLines={1}>
                {pt.subject}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    paddingLeft: 4,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  labelWrapper: {
    alignItems: 'center',
  },
  labelText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  emptyContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    marginVertical: 8,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});
