import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Colors } from '../theme/colors';
import { useGlove } from '../hooks/useGlove';
import PrimaryButton from '../components/PrimaryButton';

// ─── COMPOSANT POUR PROFIL SOURD / MALENTENDANT ──────────────────────────────
function DeafHomeView({ userData }) {
  const { isConnected, currentSign, currentPhrase, confidence, clearPhrase } = useGlove();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Animation point vert
  useEffect(() => {
    if (isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isConnected]);

  const speakPhrase = () => {
    if (!currentPhrase) return;
    setIsSpeaking(true);
    Speech.speak(currentPhrase, {
      language: 'fr-FR',
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const confidenceColor =
    confidence > 80 ? Colors.success : confidence > 50 ? Colors.warning : Colors.error;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* 1. Bannière Gants */}
      <View style={[styles.gloveBanner, isConnected ? styles.gloveActive : styles.gloveInactive]}>
        <View style={styles.gloveHeader}>
          <Animated.View style={[styles.statusDot, { opacity: pulseAnim, backgroundColor: isConnected ? Colors.success : Colors.error }]} />
          <Text style={styles.gloveTitle}>
            {isConnected ? 'Gants connectés · ACTIF' : 'Gants non détectés'}
          </Text>
        </View>
        <Text style={styles.gloveSubtitle}>
          {isConnected
            ? "Signez maintenant — votre message s'affiche en temps réel"
            : 'Veuillez allumer vos gants et vérifier la connexion Bluetooth/Wi-Fi.'}
        </Text>
        {!isConnected && (
          <TouchableOpacity style={styles.connectBtn}>
            <Text style={styles.connectBtnText}>Connecter les gants</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Signe en direct */}
      <View style={styles.liveSignCard}>
        <Text style={styles.liveSignLabel}>Signe détecté</Text>
        <Text style={styles.liveSignText}>
          {currentSign && currentSign !== 'idle' ? currentSign.toUpperCase() : '...'}
        </Text>
        {currentSign && currentSign !== 'idle' && (
          <View style={styles.confidenceRow}>
            <View style={styles.confidenceBarBg}>
              <View style={[styles.confidenceBarFill, { width: `${confidence}%`, backgroundColor: confidenceColor }]} />
            </View>
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {Math.round(confidence)}%
            </Text>
          </View>
        )}
      </View>

      {/* 3. Phrase construite */}
      <View style={styles.phraseCard}>
        <Text style={styles.phraseLabel}>Phrase en cours</Text>
        <ScrollView style={styles.phraseScroll} nestedScrollEnabled>
          <Text style={styles.phraseText}>
            {currentPhrase || 'Commencez à signer pour construire une phrase...'}
          </Text>
        </ScrollView>

        {/* 4. Boutons d'action */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnClear]}
            onPress={clearPhrase}
            disabled={!currentPhrase}
          >
            <Ionicons name="trash-outline" size={20} color={currentPhrase ? Colors.error : Colors.textMuted} />
            <Text style={[styles.actionText, { color: currentPhrase ? Colors.error : Colors.textMuted }]}>Vider</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSpeak, isSpeaking && { opacity: 0.6 }]}
            onPress={speakPhrase}
            disabled={!currentPhrase || isSpeaking}
          >
            <Ionicons name="volume-high-outline" size={20} color={currentPhrase ? '#fff' : Colors.textMuted} />
            <Text style={[styles.actionText, { color: currentPhrase ? '#fff' : Colors.textMuted }]}>Lire à voix haute</Text>
          </TouchableOpacity>
        </View>
        <PrimaryButton
          title="💬  Envoyer en message"
          variant="primary"
          size="medium"
          disabled={!currentPhrase}
          onPress={() => {}}
        />
      </View>

      {/* 5. Mini Avatar */}
      <View style={styles.avatarMiniCard}>
        <View style={styles.avatarHeader}>
          <Text style={styles.avatarTitle}>Votre interprète : {userData.avatarStyle === 'alex' ? 'ALEX' : 'FRÉZITA'}</Text>
          <TouchableOpacity>
            <Ionicons name="expand-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarEmoji}>{userData.avatarStyle === 'alex' ? '🧑‍💼' : '🤙'}</Text>
          <Text style={styles.avatarHint}>En attente d'un message entrant...</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── COMPOSANT POUR PROFIL ENTENDANT ─────────────────────────────────────────
function HearingHomeView({ userData }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* 1. Bouton Parler */}
      <TouchableOpacity style={styles.micCard} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(130,170,255,0.15)', 'rgba(130,170,255,0.05)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.micIconWrapper}>
          <Ionicons name="mic" size={48} color="#82AAFF" />
        </View>
        <Text style={styles.micTitle}>PARLER MAINTENANT</Text>
        <Text style={styles.micSubtitle}>Votre voix → traduite en LSF via avatar</Text>
      </TouchableOpacity>

      {/* 3. Contacts en ligne */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacts en ligne</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <TouchableOpacity key={i} style={styles.contactAvatar}>
              <View style={styles.contactCircle}>
                <Ionicons name="person" size={24} color={Colors.textSecondary} />
              </View>
              <View style={styles.onlineDot} />
              <Text style={styles.contactName}>Ami {i}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 2. Conversations récentes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conversations récentes</Text>
        {[1, 2, 3].map((i) => (
          <TouchableOpacity key={i} style={styles.chatRow}>
            <View style={styles.chatAvatar}>
              <Ionicons name="person" size={20} color={Colors.textSecondary} />
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>Contact {i}</Text>
              <Text style={styles.chatSnippet} numberOfLines={1}>Dernier message reçu...</Text>
            </View>
            <Text style={styles.chatTime}>10:4{i}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 4. Nouvelle conversation */}
      <View style={{ marginTop: 8 }}>
        <PrimaryButton title="Nouvelle conversation" icon={<Ionicons name="add" size={20} color="#fff" />} />
      </View>
    </ScrollView>
  );
}

// ─── ÉCRAN PRINCIPAL ─────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MODE DÉMO : On simule la récupération des données utilisateur
    setTimeout(() => {
      setUserData({
        firstName: 'Utilisateur',
        profileType: 'deaf', // 'deaf' ou 'hearing' selon la démo
        avatarStyle: 'frezita',
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isDeaf = userData?.profileType === 'deaf';

  return (
    <LinearGradient colors={['#0A0D14', '#0E1526']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {userData?.firstName || 'User'}</Text>
            <Text style={styles.profileBadge}>
              {isDeaf ? 'Mode Sourd / Malentendant' : 'Mode Entendant'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AvatarConfig')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isDeaf ? <DeafHomeView userData={userData} /> : <HearingHomeView userData={userData} />}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  loader: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10, gap: 16 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  greeting: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  profileBadge: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  // ─── DEAF VIEW STYLES ───
  gloveBanner: { borderRadius: 16, padding: 16, borderWidth: 1 },
  gloveActive: { backgroundColor: 'rgba(0, 217, 126, 0.1)', borderColor: Colors.primary },
  gloveInactive: { backgroundColor: 'rgba(255, 203, 107, 0.1)', borderColor: Colors.warning },
  gloveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  gloveTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  gloveSubtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  connectBtn: { marginTop: 12, backgroundColor: Colors.bgInput, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, alignSelf: 'flex-start' },
  connectBtnText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },

  liveSignCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  liveSignLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  liveSignText: { color: Colors.textPrimary, fontSize: 42, fontWeight: '900', letterSpacing: 2 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, width: '100%', paddingHorizontal: 20 },
  confidenceBarBg: { flex: 1, height: 6, backgroundColor: Colors.bgInput, borderRadius: 3, overflow: 'hidden' },
  confidenceBarFill: { height: '100%', borderRadius: 3 },
  confidenceText: { fontSize: 13, fontWeight: '700', width: 34 },

  phraseCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border },
  phraseLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  phraseScroll: { backgroundColor: Colors.bgInput, borderRadius: 14, padding: 16, minHeight: 100, maxHeight: 160, marginBottom: 16 },
  phraseText: { color: Colors.textPrimary, fontSize: 18, lineHeight: 28 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  actionBtnClear: { backgroundColor: Colors.bgInput },
  actionBtnSpeak: { backgroundColor: '#82AAFF' },
  actionText: { fontWeight: '600', fontSize: 14 },

  avatarMiniCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.border },
  avatarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  avatarTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  avatarPlaceholder: { backgroundColor: Colors.bgInput, borderRadius: 16, height: 120, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  avatarEmoji: { fontSize: 40, marginBottom: 8, opacity: 0.5 },
  avatarHint: { color: Colors.textMuted, fontSize: 12 },

  // ─── HEARING VIEW STYLES ───
  micCard: { borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(130,170,255,0.3)', overflow: 'hidden', marginBottom: 8 },
  micIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(130,170,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  micTitle: { color: '#82AAFF', fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  micSubtitle: { color: Colors.textSecondary, fontSize: 13 },

  section: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 },
  
  contactAvatar: { alignItems: 'center', width: 60 },
  contactCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.bgInput, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  onlineDot: { position: 'absolute', top: 2, right: 6, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.bgCard },
  contactName: { color: Colors.textPrimary, fontSize: 12, marginTop: 6, fontWeight: '500' },

  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chatAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgInput, alignItems: 'center', justifyContent: 'center' },
  chatInfo: { flex: 1 },
  chatName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  chatSnippet: { color: Colors.textSecondary, fontSize: 13 },
  chatTime: { color: Colors.textMuted, fontSize: 11 },
});
