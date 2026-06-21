import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { tileKeeperTheme } from './theme';

interface ShimmerPlaceholderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function ShimmerPlaceholder({ width = '100%', height = 16, borderRadius = 8, style }: ShimmerPlaceholderProps) {
  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 300,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [translateX]);

  return (
    <View style={[{ width, height, borderRadius, overflow: 'hidden', backgroundColor: tileKeeperTheme.colours.raisedSurface }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
            backgroundColor: 'rgba(255,255,255,0.35)',
            width: '40%',
          },
        ]}
      />
    </View>
  );
}
