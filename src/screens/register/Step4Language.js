import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../theme/colors';

const LANGUAGES = [
  { id: 'LSF', label: 'LSF', desc: 'Langue des Signes Française' },
  { id: 'ASL', label: 'ASL', desc: 'American Sign Language' },
  { id: 'LSB', label: 'LSB', desc: 'Língua de Sinais Brasileira' },
  { id: 'BSL', label: 'BSL', desc: 'British Sign Language' },
  { id: 'OTHER', label: 'Autre', desc: 'Autre langue des signes' },
];

export default function Step4Language({ formData, updateForm, navigation }) {
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      // MODE DÉMO : On simule un petit chargement
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // On passe directement au choix de l'avatar sans Firebase
      navigation.navigate('ChooseAvatar');
    } catch (err) {
      Alert.alert('Erreur', 'Erreur simulée.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Language selector */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Sélectionnez votre langue des signes</Text>
        {LANGUAGES.map((lang) => {
          const isSelected = formData.signLanguage === lang.id;
          return (
            <TouchableOpacity
              key={lang.id}
              style={[styles.langRow, isSelected && styles.langRowSelected]}
              onPress={() => updateForm({ signLanguage: lang.id })}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <View style={styles.langInfo}>
                <Text style={[styles.langLabel, isSelected && { color: Colors.primary }]}>
                  {lang.label}
                </Text>
                <Text style={styles.langDesc}>{lang.desc}</Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* City field */}
      <View style={styles.cityCard}>
        <InputField
          label="Votre ville (optionnel)"
          value={formData.city}
          onChangeText={(v) => updateForm({ city: v })}
          placeholder="Ex: Paris, Lyon, Marseille…"
        />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <View style={styles.summaryRow}>
          <Ionicons name="person-outline" size={16} color={Colors.primary} />
          <Text style={styles.summaryText}>
            {formData.firstName} {formData.lastName}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="mail-outline" size={16} color={Colors.primary} />
          <Text style={styles.summaryText}>{formData.email}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons
            name={formData.profileType === 'deaf' ? 'hand-left-outline' : 'headset-outline'}
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.summaryText}>
            {formData.profileType === 'deaf' ? 'Sourd / Malentendant' : 'Entendant'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="language-outline" size={16} color={Colors.primary} />
          <Text style={styles.summaryText}>{formData.signLanguage}</Text>
        </View>
      </View>

      <PrimaryButton
        title="🎉  Créer mon compte"
        onPress={handleCreateAccount}
        loading={loading}
        size="large"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.bgInput,
  },
  langRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  langInfo: { flex: 1 },
  langLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  langDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cityCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summary: {
    backgroundColor: Colors.bgCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
    gap: 10,
  },
  summaryTitle: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    color: Colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
});
