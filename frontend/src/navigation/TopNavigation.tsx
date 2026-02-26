import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NotificationScreen } from '../screens/NotificationScreen';

interface TopNavigationProps {
  title?: string;
  subtitle?: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  title = "Taoyuan Air",
  subtitle = "3D PARTICLE FLOW",
  onMenuPress,
  onNotificationPress
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleMenuPress = () => {
    setShowSettings(true);
    onMenuPress?.();
  };

  const handleNotificationPress = () => {
    setShowNotifications(true);
    onNotificationPress?.();
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={handleMenuPress} style={styles.iconButton}>
          <Feather name="menu" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        
        <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton}>
          <Feather name="bell" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onClose={() => setShowSettings(false)} />
      </Modal>

      <NotificationScreen
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#F4F2E9',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});