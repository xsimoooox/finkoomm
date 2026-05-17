import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

// Cloudinary base URL — replace with your actual Cloudinary cloud name
const CLOUDINARY_BASE = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/';

const AVATARS = [
  {
    id: 'frezita',
    name: 'FRÉZITA',
    tagline: 'Avatar alphabet LSF / ASL',
    description: 'Traduit les lettres une par une en langue des signes. Idéal pour épeler les noms propres et les mots inconnus.',
    idealFor: ['Orthographe & épellation', 'Noms propres', 'Mots inconnus', 'Apprentissage'],
    pipeline: 'Texte → Découpage lettres → Animation alphabet',
    example: '"Bonjour" → B→O→N→J→O→U→R',
    style: 'Animations fluides, précision des lettres',
    emoji: '🤙',
    accentColor: '#82AAFF',
    accentBg: 'rgba(130,170,255,0.1)',
    previewLetters: ['A', 'B', 'C', 'D'],
    // Cloudinary image/video references
    imagePublicId: 'voxmanus/avatars/frezita_preview',
    videoPublicId: 'voxmanus/avatars/frezita_demo',
  },
  {
    id: 'alex',
    name: 'ALEX',
    tagline: 'Avatar phrases complètes',
    description: 'Traduit les mots et phrases complètes en langue signée naturelle. Idéal pour les conversations fluides.',
    idealFor: ['Conversations quotidiennes', 'Appels vidéo', 'Temps réel', 'Rencontres QR'],
    pipeline: 'Voix/Texte → NLP → Traduction LSF → Animation phrase',
    example: '"How are you?" → avatar signe la phrase entière',
    style: 'Mouvements naturels, expressions faciales',
    emoji: '🧑‍💼',
    accentColor: Colors.primary,
    accentBg: Colors.primaryLight,
    previewLetters: null,
    imagePublicId: 'voxmanus/avatars/alex_preview',
    videoPublicId: 'voxmanus/avatars/alex_demo',
  },
];

// Helper to get Cloudinary URL
function getCloudinaryImageUrl(publicId, options = 'w_300,h_300,c_fill,q_auto,f_auto') {
  return `${CLOUDINARY_BASE}${options}/${publicId}`;
}

// Animated letter preview for Frézita
function LetterPreview({ letters, accentColor }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animate = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setActiveIdx((i) => (i + 1) % letters.length);
    });
  };

  return (
    <TouchableOpacity onPress={animate} style={styles.letterPreview}>
      <Animated.Text style={[styles.letterChar, { color: accentColor, transform: [{ scale: scaleAnim }] }]}>
        {letters[activeIdx]}
      </Animated.Text>
      <Text style={styles.letterHint}>Appuyez pour voir l'animation</Text>
    </TouchableOpacity>
  );
}

export default function ChooseAvatarScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const scales = useRef(AVATARS.map(() => new Animated.Value(1))).current;

  const handleSelect = (id, index) => {
    setSelected(id);
    Animated.sequence([
      Animated.spring(scales[index], { toValue: 0.97, useNativeDriver: true, speed: 50 }),
      Animated.spring(scales[index], { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      // MODE DÉMO : Navigation directe
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder votre choix.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0D14', '#0E1526', '#091220']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>INTERPRÈTE VIRTUEL</Text>
            </View>
            <Text style={styles.title}>Choisissez votre{'\n'}interprète virtuel</Text>
            <Text style={styles.subtitle}>
              Sélectionnez le mode de traduction en langue des signes
            </Text>
          </View>

          {/* Avatar cards */}
          {AVATARS.map((avatar, index) => {
            const isSelected = selected === avatar.id;
            return (
              <Animated.View
                key={avatar.id}
                style={[styles.cardWrapper, { transform: [{ scale: scales[index] }] }]}
              >
                <TouchableOpacity
                  style={[
                    styles.card,
                    isSelected && {
                      borderColor: avatar.accentColor,
                      backgroundColor: avatar.accentBg,
                      shadowColor: avatar.accentColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 20,
                      elevation: 10,
                    },
                  ]}
                  onPress={() => handleSelect(avatar.id, index)}
                  activeOpacity={0.88}
                >
                  {/* Selection badge */}
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: avatar.accentColor }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                      <Text style={styles.selectedBadgeText}>Sélectionné</Text>
                    </View>
                  )}

                  {/* Avatar visual */}
                  <View style={styles.avatarVisual}>
                    <LinearGradient
                      colors={[avatar.accentBg, 'transparent']}
                      style={styles.avatarBg}
                    >
                      {/* Cloudinary 3D avatar image */}
                      <Image
                        source={{ uri: getCloudinaryImageUrl(avatar.imagePublicId) }}
                        style={styles.avatarImage}
                        defaultSource={require('../../assets/icon.png')}
                      />
                      {/* Fallback emoji */}
                      <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
                    </LinearGradient>

                    {/* Letter preview for Frézita */}
                    {avatar.previewLetters && (
                      <LetterPreview
                        letters={avatar.previewLetters}
                        accentColor={avatar.accentColor}
                      />
                    )}
                  </View>

                  {/* Card content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardName, isSelected && { color: avatar.accentColor }]}>
                        {avatar.name}
                      </Text>
                      <View style={[styles.tagBadge, { borderColor: avatar.accentColor }]}>
                        <Text style={[styles.tagText, { color: avatar.accentColor }]}>
                          {avatar.tagline}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardDescription}>{avatar.description}</Text>

                    {/* Ideal for tags */}
                    <View style={styles.idealRow}>
                      {avatar.idealFor.map((item, fi) => (
                        <View key={fi} style={[styles.idealTag, { borderColor: avatar.accentColor + '50' }]}>
                          <Text style={[styles.idealTagText, { color: avatar.accentColor }]}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Pipeline */}
                    <View style={styles.infoRow}>
                      <Ionicons name="git-branch-outline" size={14} color={avatar.accentColor} />
                      <Text style={styles.infoText}>{avatar.pipeline}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="chatbubble-outline" size={14} color={avatar.accentColor} />
                      <Text style={styles.infoText}>{avatar.example}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="sparkles-outline" size={14} color={avatar.accentColor} />
                      <Text style={styles.infoText}>{avatar.style}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Confirm button */}
          <View style={styles.confirmSection}>
            <PrimaryButton
              title="Confirmer mon choix"
              onPress={handleConfirm}
              loading={loading}
              disabled={!selected}
              size="large"
            />
            {selected && (
              <Text style={styles.confirmNote}>
                Vous pourrez changer d'interprète à tout moment dans les paramètres.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
  },
  headerBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
    marginBottom: 14,
  },
  headerBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  cardWrapper: {
    marginBottom: 18,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    margin: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarVisual: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'absolute',
  },
  avatarEmoji: {
    fontSize: 52,
  },
  letterPreview: {
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: Colors.bgInput,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  letterChar: {
    fontSize: 40,
    fontWeight: '900',
  },
  letterHint: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  cardContent: {
    padding: 20,
    paddingTop: 0,
  },
  cardTitleRow: {
    marginBottom: 10,
    gap: 8,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDescription: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  idealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 16,
  },
  idealTag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  idealTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  confirmSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  confirmNote: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
});
