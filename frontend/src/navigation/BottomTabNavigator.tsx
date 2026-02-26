import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { MapScreen } from '../screens/MapScreen';
import { ExplorerScreen } from '../screens/ExplorerScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { AlertsScreen } from '../screens/AlertsScreen';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC = () => {
  const scrollRefs = useRef<{[key: string]: any}>({});
  const lastTapTime = useRef<{[key: string]: number}>({});

  const handleTabPress = (routeName: string, navigation: any) => {
    const now = Date.now();
    const lastTap = lastTapTime.current[routeName] || 0;
    
    // Always navigate first
    navigation.navigate(routeName);
    
    // Then scroll to top
    setTimeout(() => {
      if (scrollRefs.current[routeName]) {
        scrollRefs.current[routeName].scrollTo({ y: 0, animated: true });
      }
    }, 100);
    
    if (now - lastTap < 300) {
      // Double tap - additional scroll to top (redundant but ensures it works)
      setTimeout(() => {
        if (scrollRefs.current[routeName]) {
          scrollRefs.current[routeName].scrollTo({ y: 0, animated: true });
        }
      }, 200);
    }
    
    lastTapTime.current[routeName] = now;
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Feather.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home';
              break;
            case 'Map':
              iconName = 'map';
              break;
            case 'Explorer':
              iconName = 'search';
              break;
            case 'Events':
              iconName = 'calendar';
              break;
            case 'Alerts':
              iconName = 'bell';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <Feather 
              name={iconName} 
              size={24} 
              color={focused ? '#6A8D73' : '#B5C99A'} 
            />
          );
        },
        tabBarActiveTintColor: '#6A8D73',
        tabBarInactiveTintColor: '#B5C99A',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          backgroundColor: '#F4F2E9',
          paddingBottom: 30,
          paddingTop: 10,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(106, 141, 115, 0.2)',
        },
        tabBarBackground: undefined,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 5,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        options={({ navigation }) => ({
          tabBarLabel: '總覽',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleTabPress('Dashboard', navigation)}
            />
          )
        })}
      >
        {() => <DashboardScreen scrollRef={(ref: any) => scrollRefs.current.Dashboard = ref} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Map" 
        options={({ navigation }) => ({
          tabBarLabel: '地圖',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleTabPress('Map', navigation)}
            />
          )
        })}
      >
        {() => <MapScreen scrollRef={(ref: any) => scrollRefs.current.Map = ref} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Explorer" 
        options={({ navigation }) => ({
          tabBarLabel: '檢索',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleTabPress('Explorer', navigation)}
            />
          )
        })}
      >
        {() => <ExplorerScreen scrollRef={(ref: any) => scrollRefs.current.Explorer = ref} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Events" 
        options={({ navigation }) => ({
          tabBarLabel: '事件',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleTabPress('Events', navigation)}
            />
          )
        })}
      >
        {() => <EventsScreen scrollRef={(ref: any) => scrollRefs.current.Events = ref} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Alerts" 
        options={({ navigation }) => ({
          tabBarLabel: '警報',
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => handleTabPress('Alerts', navigation)}
            />
          )
        })}
      >
        {() => <AlertsScreen scrollRef={(ref: any) => scrollRefs.current.Alerts = ref} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};