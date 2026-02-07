import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { GlassCard } from "../components/GlassCard";

interface SettingsScreenProps {
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  return (
    <LinearGradient colors={["#F4F2E9", "#E8E6D3"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>用戶設定</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>陳</Text>
            </View>
            <View style={styles.premiumBadge}>
              <Feather name="star" size={12} color="white" />
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          </View>
          <Text style={styles.userName}>陳小明</Text>
          <Text style={styles.userEmail}>wei-ting.chen@taoyuan.io</Text>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          <GlassCard style={styles.settingItem}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: "#6A8D73" }]}
                >
                  <Feather name="shield" size={20} color="white" />
                </View>
                <Text style={styles.settingTitle}>帳戶安全</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </View>
          </GlassCard>

          <GlassCard style={styles.settingItem}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: "#B5C99A" }]}
                >
                  <Feather name="user-check" size={20} color="white" />
                </View>
                <Text style={styles.settingTitle}>身份驗證</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </View>
          </GlassCard>

          <GlassCard style={styles.settingItem}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: "#6A8D73" }]}
                >
                  <Feather name="heart" size={20} color="white" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>健康檔案設定</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </View>
          </GlassCard>

          <GlassCard style={styles.settingItem}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View
                  style={[styles.settingIcon, { backgroundColor: "#B5C99A" }]}
                >
                  <Feather name="bell" size={20} color="white" />
                </View>
                <Text style={styles.settingTitle}>通知偏好設定</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#999" />
            </View>
          </GlassCard>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>TAOYUAN AIR V2.4.0</Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#D4B896",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  premiumBadge: {
    position: "absolute",
    bottom: -2,
    left: "50%",
    marginLeft: -185,
    backgroundColor: "#6A8D73",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  settingsSection: {
    gap: 8,
    marginBottom: 20,
  },
  settingItem: {
    padding: 0,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#6A8D73",
    marginTop: 2,
  },
  logoutButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 12,
    marginHorizontal: 60,
    borderWidth: 2,
    borderColor: "#E76F51",
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    color: "#E76F51",
    fontWeight: "600",
  },
  versionText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
});
