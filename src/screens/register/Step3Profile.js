import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../theme/colors';

const PROFILES = [
  {
    id: 'hearing',
    title: 'Je suis ENTENDANT(E)',
    emoji: '🎧',
    features: [
      'Je peux entendre et parler normalement',
      'Je communique par texte et/ou voix',
      'Pas besoin de traduction LSF',
    ],
    accentColor: '#82AAFF',
    accentBg: 'rgba(130,170,255,0.1)',
  },
  {
    id: 'deaf',
    title: 'Je suis SOURD(E) / MALENTENDANT(E)',
    emoji: '🤟',
    features: [
      "J'utilise la langue des signes",
      'Mes signes sont traduits en texte + voix',
      'Les messages arrivent en LSF via avatar',
    ],
    accentColor: Colors.primary,
    accentBg: Colors.primaryLight,
  },
];

export default function Step3Profile({ formData, updateForm, onNext }) {
  const scales = useRef(PROFILES.map(() => new Animated.Value(1))).current;

  const handleSelect = (id, index) => {
    updateForm({ profileType: id });
    Animated.sequence([
      Animated.spring(scales[index], {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(scales[index], {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
      }),
    ]).start();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.hint}>
        Choisissez votre profil pour personnaliser votre expérience
      </Text>

      {PROFILES.map((profile, index) => {
        const isSelected = formData.profileType === profile.id;
        return (
          <Animated.View
            key={profile.id}
            style={{ transform: [{ scale: scales[index] }], width: '100%' }}
          >
            <TouchableOpacity
              style={[
                styles.card,
                isSelected && {
                  borderColor: profile.accentColor,
                  backgroundColor: profile.accentBg,
                  shadowColor: profile.accentColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 8,
                },
              ]}
              onPress={() => handleSelect(profile.id, index)}
              activeOpacity={0.85}
            >
              {/* Check mark */}
              {isSelected && (
                <View style={[styles.check, { backgroundColor: profile.accentColor }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}

              <Text style={styles.cardEmoji}>{profile.emoji}</Text>
              <Text style={[styles.cardTitle, isSelected && { color: profile.accentColor }]}>
                {profile.title}
              </Text>

              <View style={styles.featureList}>
                {profile.features.map((feat, fi) => (
                  <View key={fi} style={styles.featureRow}>
                    <View style={[styles.featureDot, { backgroundColor: profile.accentColor }]} />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <View style={styles.footer}>
        <PrimaryButton
          title="Continuer →"
          onPress={onNext}
          disabled={!formData.profileType}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 14,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    padding: 22,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  check: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  featureList: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  featureText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    width: '100%',
    marginTop: 8,
  },
});
