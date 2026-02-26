import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  const sizeStyles = {
    small: { width: 24, height: 24, fontSize: 12 },
    medium: { width: 32, height: 32, fontSize: 16 },
    large: { width: 40, height: 40, fontSize: 20 }
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, { width: currentSize.width, height: currentSize.height }]}>
      <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>T</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6A8D73',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});