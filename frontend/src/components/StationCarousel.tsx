import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_SPACING = 18;
const SIDE_SPACING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

interface StationData {
  name: string;
  type: string;
  pm25: number;
  o3: number;
  aqi: number;
  status: 'GOOD' | 'MODERATE' | 'UNHEALTHY';
  trend: number[];
}

const STATIONS: StationData[] = [
  {
    name: 'Zhongli',
    type: 'TRAFFIC STATION',
    pm25: 18,
    o3: 42,
    aqi: 72,
    status: 'MODERATE',
    trend: [0.4, 0.5, 0.6, 0.55, 0.7, 0.75],
  },
  {
    name: 'Longtan',
    type: 'GENERAL STATION',
    pm25: 15,
    o3: 38,
    aqi: 65,
    status: 'MODERATE',
    trend: [0.3, 0.35, 0.4, 0.45, 0.5, 0.48],
  },
  {
    name: 'Guanyin',
    type: 'BACKGROUND STATION',
    pm25: 22,
    o3: 45,
    aqi: 78,
    status: 'MODERATE',
    trend: [0.5, 0.6, 0.65, 0.7, 0.68, 0.72],
  },
  {
    name: 'Dayuan',
    type: 'GENERAL STATION',
    pm25: 12,
    o3: 35,
    aqi: 58,
    status: 'GOOD',
    trend: [0.25, 0.3, 0.28, 0.32, 0.35, 0.33],
  },
  {
    name: 'Taoyuan',
    type: 'GENERAL STATION',
    pm25: 20,
    o3: 48,
    aqi: 75,
    status: 'MODERATE',
    trend: [0.45, 0.5, 0.55, 0.6, 0.58, 0.62],
  },
  {
    name: 'Pingzhen',
    type: 'GENERAL STATION',
    pm25: 16,
    o3: 40,
    aqi: 68,
    status: 'MODERATE',
    trend: [0.35, 0.4, 0.42, 0.45, 0.48, 0.5],
  },
];

const TrendLine: React.FC<{ trend: number[] }> = ({ trend }) => {
  const width = 220;
  const height = 40;
  const points = trend.map((value, index) => ({
    x: (index / (trend.length - 1)) * width,
    y: height - value * height,
  }));

  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prevPoint = points[index - 1];
    const cpX = (prevPoint.x + point.x) / 2;
    return `${acc} Q ${cpX} ${prevPoint.y}, ${cpX} ${(prevPoint.y + point.y) / 2} Q ${cpX} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  return (
    <Svg width={width} height={height} style={styles.trendSvg}>
      <Path
        d={pathData}
        stroke="#6abe74"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const StationCard: React.FC<{ station: StationData }> = ({ station }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.stationName}>{station.name}</Text>
        <Text style={styles.updateTime}>Updated 10:37</Text>
      </View>

      <View style={styles.stationTypeRow}>
        <Feather name="radio" size={14} color="#6abe74" />
        <Text style={styles.stationType}>{station.type}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>PM2.5</Text>
          <Text style={styles.metricValue}>{station.pm25}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>O3</Text>
          <Text style={styles.metricValue}>{station.o3}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>AQI</Text>
          <Text style={[styles.metricValue, { color: '#6abe74' }]}>
            {station.aqi}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={[styles.statusBadge, { color: '#6abe74' }]}>
          {station.status}
        </Text>
        <Text style={styles.trendLabel}>24h Trend</Text>
      </View>

      <View style={styles.trendContainer}>
        <TrendLine trend={station.trend} />
      </View>
    </View>
  );
};

export const StationCarousel: React.FC = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);
  const currentIndex = useRef(0);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, []);

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayInterval.current = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % STATIONS.length;
      scrollViewRef.current?.scrollTo({
        x: currentIndex.current * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    }, 4000);
  };

  const stopAutoPlay = () => {
    if (autoPlayInterval.current) {
      clearInterval(autoPlayInterval.current);
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    
    if (newIndex >= STATIONS.length) {
      currentIndex.current = 0;
      scrollViewRef.current?.scrollTo({
        x: 0,
        animated: false,
      });
    } else if (newIndex < 0) {
      currentIndex.current = STATIONS.length - 1;
      scrollViewRef.current?.scrollTo({
        x: (STATIONS.length - 1) * (CARD_WIDTH + CARD_SPACING),
        animated: false,
      });
    } else {
      currentIndex.current = newIndex;
    }
    
    startAutoPlay();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="center"
        contentContainerStyle={{
          paddingHorizontal: SIDE_SPACING,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onScrollBeginDrag={stopAutoPlay}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {STATIONS.map((station, index) => {
          const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.88, 1, 0.88],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.7, 1, 0.7],
            extrapolate: 'clamp',
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [12, 0, 12],
            extrapolate: 'clamp',
          });

          const shadowOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.08, 0.15, 0.08],
            extrapolate: 'clamp',
          });

          const shadowRadius = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={station.name}
              style={[
                styles.cardWrapper,
                {
                  transform: [{ scale }, { translateY }],
                  opacity,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.cardShadow,
                  {
                    shadowOpacity,
                    shadowRadius,
                  },
                ]}
              >
                <StationCard station={station} />
              </Animated.View>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={styles.pagination}>
        {STATIONS.map((_, index) => {
          const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [6, 18, 6],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <TouchableOpacity
              key={index}
              onPress={() => {
                currentIndex.current = index;
                scrollViewRef.current?.scrollTo({
                  x: index * (CARD_WIDTH + CARD_SPACING),
                  animated: true,
                });
              }}
            >
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  updateTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  stationTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  stationType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6abe74',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  trendLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  trendContainer: {
    height: 40,
    justifyContent: 'center',
  },
  trendSvg: {
    marginLeft: -10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6abe74',
  },
});
