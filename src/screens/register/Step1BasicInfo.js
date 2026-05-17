import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../theme/colors';

// Password strength calculator
function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: Colors.border };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const levels = [
    { score: 1, label: 'Très faible', color: Colors.strengthWeak },
    { score: 2, label: 'Faible', color: Colors.strengthFair },
    { score: 3, label: 'Bon', color: Colors.strengthGood },
    { score: 4, label: 'Fort', color: Colors.strengthStrong },
  ];
  return levels[score - 1] || { score: 0, label: '', color: Colors.border };
}

export default function Step1BasicInfo({ formData, updateForm, onNext }) {
  const [errors, setErrors] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const emailTimer = useRef(null);

  const strength = getPasswordStrength(formData.password);

  const checkEmailUniqueness = useCallback(async (email) => {
    if (!/\S+@\S+\.\S+/.test(email)) return;
    setEmailChecking(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
      const snap = await getDocs(q);
      setEmailAvailable(snap.empty);
    } catch {
      setEmailAvailable(null);
    } finally {
      setEmailChecking(false);
    }
  }, []);

  const handleEmailChange = (val) => {
    updateForm({ email: val });
    setEmailAvailable(null);
    clearTimeout(emailTimer.current);
    emailTimer.current = setTimeout(() => checkEmailUniqueness(val), 800);
  };

  const validate = () => {
    const e = {};
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2)
      e.firstName = 'Prénom requis (min. 2 caractères)';
    if (formData.firstName.trim().length > 50)
      e.firstName = 'Prénom trop long (max. 50 caractères)';
    if (!formData.lastName.trim())
      e.lastName = 'Nom requis';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      e.email = 'Email invalide';
    if (emailAvailable === false)
      e.email = 'Cet email est déjà utilisé.';
    if (!formData.password || formData.password.length < 8)
      e.password = 'Mot de passe trop court (min. 8 caractères)';
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isFormFilled =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 1 &&
    /\S+@\S+\.\S+/.test(formData.email) &&
    emailAvailable !== false &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <InputField
          label="Prénom *"
          value={formData.firstName}
          onChangeText={(v) => updateForm({ firstName: v })}
          placeholder="Votre prénom"
          error={errors.firstName}
          success={!errors.firstName && formData.firstName.trim().length >= 2}
        />
        <InputField
          label="Nom *"
          value={formData.lastName}
          onChangeText={(v) => updateForm({ lastName: v })}
          placeholder="Votre nom"
          error={errors.lastName}
          success={!errors.lastName && formData.lastName.trim().length >= 1}
        />
        <InputField
          label="Email *"
          value={formData.email}
          onChangeText={handleEmailChange}
          placeholder="vous@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={
            errors.email ||
            (emailAvailable === false ? 'Cet email est déjà utilisé.' : null)
          }
          success={emailAvailable === true}
          rightElement={
            emailChecking ? (
              <Text style={{ color: Colors.textMuted, fontSize: 11 }}>…</Text>
            ) : emailAvailable === true ? null : null
          }
        />

        {/* Email availability badge */}
        {emailAvailable === true && (
          <Text style={styles.emailOk}>✓ Email disponible</Text>
        )}
        {emailAvailable === false && (
          <Text style={styles.emailTaken}>✗ Email déjà utilisé</Text>
        )}

        <InputField
          label="Mot de passe *"
          value={formData.password}
          onChangeText={(v) => updateForm({ password: v })}
          placeholder="Min. 8 caractères"
          secureTextEntry
          error={errors.password}
        />

        {/* Password strength indicator */}
        {formData.password.length > 0 && (
          <View style={styles.strengthRow}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.strengthBar,
                  {
                    backgroundColor:
                      i <= strength.score ? strength.color : Colors.bgInput,
                  },
                ]}
              />
            ))}
            <Text style={[styles.strengthLabel, { color: strength.color }]}>
              {strength.label}
            </Text>
          </View>
        )}

        <InputField
          label="Confirmer le mot de passe *"
          value={formData.confirmPassword}
          onChangeText={(v) => updateForm({ confirmPassword: v })}
          placeholder="Répétez votre mot de passe"
          secureTextEntry
          error={errors.confirmPassword}
          success={
            formData.confirmPassword.length > 0 &&
            formData.password === formData.confirmPassword
          }
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continuer →"
          onPress={() => {
            if (validate()) onNext();
          }}
          disabled={!isFormFilled}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailOk: {
    color: Colors.success,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 4,
  },
  emailTaken: {
    color: Colors.error,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 4,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 12,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 60,
  },
  footer: {
    marginTop: 24,
  },
});
