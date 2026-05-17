import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';

/**
 * VOXMANUS Logo — two stylised signing hands + text mark
 */
export default function VoxmanusLogo({ size = 120, showText = true }) {
  const s = size;
  const scale = s / 120;

  return (
    <View style={styles.container}>
      <Svg width={s} height={s} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00D97E" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00A85E" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#82AAFF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#00D97E" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Glow circle */}
        <Circle cx="60" cy="60" r="58" fill="rgba(0,217,126,0.06)" />
        <Circle cx="60" cy="60" r="50" fill="rgba(0,217,126,0.04)" />

        {/* Left hand — pointing up/open */}
        <G transform="translate(18, 22)">
          {/* Palm */}
          <Path
            d="M14 55 C14 55 8 50 8 42 L8 28 C8 26 10 24 12 24 L12 18 C12 16 14 14 16 14 C18 14 20 16 20 18 L20 12 C20 10 22 8 24 8 C26 8 28 10 28 12 L28 16 C28 14 30 12 32 12 C34 12 36 14 36 16 L36 24 C38 22 40 22 40 24 L40 36 C40 42 36 52 30 56 L26 58 Z"
            fill="url(#grad1)"
            opacity="0.95"
          />
          {/* Thumb */}
          <Path
            d="M8 30 C6 28 4 28 4 32 C4 38 8 42 12 44"
            stroke="url(#grad1)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* Right hand — different gesture (pointing/waving) */}
        <G transform="translate(66, 22) scale(-1,1) translate(-44,0)">
          {/* Palm */}
          <Path
            d="M14 55 C14 55 8 50 8 42 L8 28 C8 26 10 24 12 24 L12 18 C12 16 14 14 16 14 C18 14 20 16 20 18 L20 12 C20 10 22 8 24 8 C26 8 28 10 28 12 L28 16 C28 14 30 12 32 12 C34 12 36 14 36 16 L36 24 C38 22 40 22 40 24 L40 36 C40 42 36 52 30 56 L26 58 Z"
            fill="url(#grad2)"
            opacity="0.9"
          />
          {/* Thumb */}
          <Path
            d="M8 30 C6 28 4 28 4 32 C4 38 8 42 12 44"
            stroke="url(#grad2)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* Signal arcs between hands */}
        <Path
          d="M52 72 Q60 62 68 72"
          stroke="#00D97E"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <Path
          d="M47 78 Q60 65 73 78"
          stroke="#00D97E"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.45"
        />

        {/* Centre dot */}
        <Circle cx="60" cy="74" r="3" fill="#00D97E" opacity="0.9" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
