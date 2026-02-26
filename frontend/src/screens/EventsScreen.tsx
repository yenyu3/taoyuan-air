import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import MapView, { Polygon, Marker, Region } from 'react-native-maps';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { TopNavigation } from "../navigation/TopNavigation";
import { useStore } from "../store";

interface EventsScreenProps {
  scrollRef?: (ref: any) => void;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({ scrollRef }) => {
  const [selectedFilter, setSelectedFilter] = useState("活躍事件");
  const [selectedDistrict, setSelectedDistrict] = useState("所有區域");
  const [selectedSeverity, setSelectedSeverity] = useState("嚴重度");
  const [showFilterDropdown, setShowFilterDropdown] = useState<string | null>(null);

  const filterOptions = {
    events: ["活躍事件", "歷史事件", "已解決事件"],
    districts: ["所有區域", "蘆竹區", "觀音區", "中壢區", "桃園區", "大園區"],
    severity: ["嚴重度", "高風險", "中等風險", "低風險"]
  };

  const eventData = [
    {
      id: 1,
      category: "工業聚集區",
      title: "觀音中心排放",
      description: "在工業區範圍內檢測到局部 SO2 尖峰。",
      severity: "中等風險",
      status: "固定站",
      trend: "穩定中",
      exposure: "~1.2k 人",
      duration: "45分鐘 持續",
      location: "觀音區",
      healthIndex: "敏感警告",
      severityColor: "#FFB74D",
      statusColor: "#FFFFFF",
      icon: "business",
    },
    {
      id: 2,
      category: "大氣流入",
      title: "重度 PM2.5 流入",
      description: "跨境污染物影響北部住宅區域。",
      severity: "嚴重程度",
      status: "AI 識別",
      duration: "2小時15分鐘 活躍",
      location: "蘆竹區",
      confidence: "98.4%",
      severityColor: "#E57373",
      statusColor: "#FFFFFF",
      icon: "warning",
    },
  ];

  return (
    <LinearGradient colors={["#F4F2E9", "#E8E6D3"]} style={styles.container}>
      <TopNavigation
        title="事件庫"
        subtitle="INCIDENT TRACKING"
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity 
            style={[styles.filterButton, showFilterDropdown === 'events' && styles.activeFilter]}
            onPress={() => setShowFilterDropdown(showFilterDropdown === 'events' ? null : 'events')}
          >
            <Text style={[styles.filterText, showFilterDropdown === 'events' && styles.activeFilterText]}>
              {selectedFilter}
            </Text>
            <Ionicons name="chevron-down" size={16} color={showFilterDropdown === 'events' ? "white" : "#6A8D73"} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, showFilterDropdown === 'districts' && styles.activeFilter]}
            onPress={() => setShowFilterDropdown(showFilterDropdown === 'districts' ? null : 'districts')}
          >
            <Text style={[styles.filterText, showFilterDropdown === 'districts' && styles.activeFilterText]}>{selectedDistrict}</Text>
            <Ionicons name="chevron-down" size={16} color={showFilterDropdown === 'districts' ? "white" : "#6A8D73"} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterButton, showFilterDropdown === 'severity' && styles.activeFilter]}
            onPress={() => setShowFilterDropdown(showFilterDropdown === 'severity' ? null : 'severity')}
          >
            <Text style={[styles.filterText, showFilterDropdown === 'severity' && styles.activeFilterText]}>{selectedSeverity}</Text>
            <Ionicons name="filter" size={16} color={showFilterDropdown === 'severity' ? "white" : "#6A8D73"} />
          </TouchableOpacity>
        </ScrollView>

        {/* Filter Dropdowns */}
        {showFilterDropdown === 'events' && (
          <View style={styles.dropdownContainer}>
            {filterOptions.events.map(option => (
              <TouchableOpacity 
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedFilter(option);
                  setShowFilterDropdown(null);
                }}
              >
                <Text style={styles.dropdownText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showFilterDropdown === 'districts' && (
          <View style={styles.dropdownContainer}>
            {filterOptions.districts.map(option => (
              <TouchableOpacity 
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedDistrict(option);
                  setShowFilterDropdown(null);
                }}
              >
                <Text style={styles.dropdownText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showFilterDropdown === 'severity' && (
          <View style={styles.dropdownContainer}>
            {filterOptions.severity.map(option => (
              <TouchableOpacity 
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedSeverity(option);
                  setShowFilterDropdown(null);
                }}
              >
                <Text style={styles.dropdownText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Event Cards */}
        <View style={styles.eventsContainer}>
          {eventData.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              {/* Event Image with Overlay */}
              <View style={styles.eventImageContainer}>
                <MapView
                  style={styles.eventMap}
                  initialRegion={{
                    latitude: event.id === 1 ? 25.035 : 25.0,
                    longitude: event.id === 1 ? 121.3 : 121.25,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: event.id === 1 ? 25.035 : 25.0,
                      longitude: event.id === 1 ? 121.3 : 121.25,
                    }}
                  >
                    <View style={[styles.eventMarkerPin, { backgroundColor: event.severityColor }]} />
                  </Marker>
                </MapView>

                  {/* Gradient Overlay */}
                  <LinearGradient
                    colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]}
                    style={styles.gradientOverlay}
                  />

                  {/* Top Badges */}
                  <View style={styles.topBadges}>
                    <View
                      style={[
                        styles.severityBadge,
                        { backgroundColor: event.severityColor },
                      ]}
                    >
                      <Text style={styles.badgeText}>{event.severity}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: "rgba(255,255,255,0.9)" },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: "#333" }]}>
                        {event.status}
                      </Text>
                    </View>
                  </View>

                  {/* Bottom Info */}
                  <View style={styles.bottomInfo}>
                    <Text style={styles.categoryText}>影響類別</Text>
                    <Text style={styles.categoryTitle}>{event.category}</Text>
                  </View>
              </View>

              {/* Event Content */}
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleContainer}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDescription}>
                      {event.description}
                    </Text>
                  </View>
                  <View style={styles.eventIcon}>
                    <Ionicons
                      name={event.icon as any}
                      size={28}
                      color="#6ABD73"
                    />
                  </View>
                </View>

                {/* Event Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="time" size={20} color="#666" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>持續時間</Text>
                      <Text style={styles.detailValue}>{event.duration}</Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="location" size={20} color="#666" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>位置</Text>
                      <Text style={styles.detailValue}>{event.location}</Text>
                    </View>
                  </View>

                  {event.trend && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="trending-up" size={20} color="#666" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>趨勢</Text>
                        <Text style={styles.detailValue}>{event.trend}</Text>
                      </View>
                    </View>
                  )}

                  {event.exposure && (
                    <View style={styles.detailItem}>
                      <View style={styles.detailIcon}>
                        <Ionicons name="people" size={20} color="#666" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>暴露人口</Text>
                        <Text style={styles.detailValue}>{event.exposure}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Bottom Action */}
                <View style={styles.eventFooter}>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>
                      {event.confidence ? "AI 信心分數" : "健康指數"}
                    </Text>
                    <Text
                      style={[
                        styles.confidenceValue,
                        { color: event.confidence ? "#6ABD73" : "#F59E0B" },
                      ]}
                    >
                      {event.confidence || event.healthIndex}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      event.confidence
                        ? styles.primaryActionButton
                        : styles.secondaryActionButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        event.confidence
                          ? styles.primaryActionText
                          : styles.secondaryActionText,
                      ]}
                    >
                      {event.confidence ? "AI 證據" : "完整分析"}
                    </Text>
                    <Ionicons
                      name={event.confidence ? "analytics" : "trending-up"}
                      size={18}
                      color={event.confidence ? "white" : "#333"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  filterScrollView: {
    paddingBottom: 20,
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    gap: 6,
  },
  activeFilter: {
    backgroundColor: "#6ABD73",
    shadowColor: "#6ABD73",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6A8D73",
  },
  activeFilterText: {
    color: "white",
  },
  eventsContainer: {
    paddingHorizontal: 20,
    gap: 24,
  },
  eventCard: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  eventImageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    position: "relative",
  },
  eventMap: {
    width: '100%',
    height: '100%',
  },
  eventMarkerPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBadges: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    zIndex: 10,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomInfo: {
    position: "absolute",
    bottom: 16,
    left: 16,
    zIndex: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    lineHeight: 28,
  },
  dropdownContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  eventContent: {
    padding: 24,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  eventTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  eventIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(106, 189, 115, 0.1)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  confidenceContainer: {
    flex: 1,
  },
  confidenceLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  primaryActionButton: {
    backgroundColor: "#6ABD73",
  },
  secondaryActionButton: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryActionText: {
    color: "white",
  },
  secondaryActionText: {
    color: "#333",
  },
  bottomSpacing: {
    height: 100,
  },
});

export default EventsScreen;
