import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez entrer un email valide.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('Aucun compte associé à cet email.');
      } else {
        setError('Erreur. Vérifiez votre connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0D14', '#0E1526']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.icon}>
              <Ionicons name="lock-closed" size={48} color={Colors.primary} />
            </View>

            <Text style={styles.title}>Mot de passe oublié</Text>
            <Text style={styles.subtitle}>
              Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
            </Text>

            {sent ? (
              <View style={styles.successCard}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.primary} />
                <Text style={styles.successTitle}>Email envoyé !</Text>
                <Text style={styles.successText}>
                  Vérifiez votre boîte de réception et suivez le lien pour réinitialiser votre mot de passe.
                </Text>
                <View style={{ height: 24 }} />
                <PrimaryButton
                  title="Retour à la connexion"
                  onPress={() => navigation.navigate('Login')}
                />
              </View>
            ) : (
              <View style={styles.card}>
                <InputField
                  label="Adresse email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vous@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={error}
                />
                <PrimaryButton
                  title="Envoyer le lien"
                  onPress={handleReset}
                  loading={loading}
                  disabled={email.trim().length < 5}
                />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: {
    marginTop: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 24,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  successCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 16,
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
