import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import StepIndicator from '../components/StepIndicator';

// Steps
import Step1BasicInfo from './register/Step1BasicInfo';
import Step2Photo from './register/Step2Photo';
import Step3Profile from './register/Step3Profile';
import Step4Language from './register/Step4Language';

const STEP_TITLES = [
  'Qui êtes-vous ?',
  'Votre photo',
  'Comment communiquez-vous ?',
  'Langue des signes',
];

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    photoURL: null,
    profileType: null, // 'hearing' | 'deaf'
    signLanguage: 'LSF',
    city: '',
  });

  const slideAnim = useRef(new Animated.Value(0)).current;

  const updateForm = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const goNext = () => {
    if (step < 4) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 30, duration: 0, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderStep = () => {
    const props = { formData, updateForm, onNext: goNext, navigation };
    switch (step) {
      case 1: return <Step1BasicInfo {...props} />;
      case 2: return <Step2Photo {...props} />;
      case 3: return <Step3Profile {...props} />;
      case 4: return <Step4Language {...props} />;
      default: return null;
    }
  };

  return (
    <LinearGradient colors={['#0A0D14', '#0E1526']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.stepLabel}>Étape {step} / 4</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.indicatorRow}>
          <StepIndicator currentStep={step} totalSteps={4} />
        </View>

        {/* Step title */}
        <Text style={styles.stepTitle}>{STEP_TITLES[step - 1]}</Text>

        {/* Step content */}
        <Animated.View
          style={[styles.content, { transform: [{ translateX: slideAnim }] }]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {renderStep()}
          </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  indicatorRow: {
    paddingHorizontal: 40,
    paddingVertical: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
});
