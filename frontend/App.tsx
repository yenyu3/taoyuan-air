import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#F4F2E9" />
      <BottomTabNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F2E9',
  },
});