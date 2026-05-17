import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import VoxmanusLogo from '../components/VoxmanusLogo';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const logoAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  // Floating animation for logo
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry sequence
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  return (
    <LinearGradient colors={['#0A0D14', '#0E1526', '#091220']} style={styles.root}>
      <SafeAreaView style={styles.safe}>

        {/* Background decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        {/* Logo + tagline */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: logoAnim,
              transform: [
                { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
                { translateY: floatY },
              ],
            },
          ]}
        >
          <VoxmanusLogo size={130} />
          <Text style={styles.brandName}>VOXMANUS</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: textAnim,
            transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}
        >
          <Text style={styles.tagline}>Communiquer sans frontières</Text>
          <Text style={styles.subtitle}>
            La plateforme de communication inclusive{'\n'}pour entendants et sourds
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonsSection,
            {
              opacity: buttonsAnim,
              transform: [{ translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            },
          ]}
        >
          <PrimaryButton
            title="Se connecter"
            onPress={() => navigation.navigate('Login')}
            size="large"
          />

          <View style={{ height: 14 }} />

          <PrimaryButton
            title="Créer un compte"
            onPress={() => navigation.navigate('Register')}
            variant="outline"
            size="large"
          />

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom label */}
        <Text style={styles.version}>VOXMANUS v1.0 · Communication inclusive</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.primaryGlow,
  },
  circle1: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
    opacity: 0.3,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -60,
    opacity: 0.2,
    backgroundColor: 'rgba(130,170,255,0.12)',
  },
  circle3: {
    width: 120,
    height: 120,
    top: height * 0.35,
    right: -20,
    opacity: 0.15,
  },
  logoSection: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 6,
    marginTop: 16,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },
  buttonsSection: {
    width: '100%',
    alignItems: 'center',
  },
  forgotLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  forgotText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  version: {
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
