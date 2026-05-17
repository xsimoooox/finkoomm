import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import PrimaryButton from '../components/PrimaryButton';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

// Cloudinary base
const CLOUDINARY_BASE = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/';

function getCloudinaryUrl(publicId, transform = 'w_300,h_300,c_fill,q_auto,f_auto') {
  return `${CLOUDINARY_BASE}${transform}/${publicId}`;
}

// ─── Configuration options ────────────────────────────────────
const SKIN_TONES = [
  { id: 'light', color: '#FDDBB4', label: 'Clair' },
  { id: 'medium_light', color: '#E8B887', label: 'Moyen clair' },
  { id: 'medium', color: '#C68642', label: 'Moyen' },
  { id: 'medium_dark', color: '#8D5524', label: 'Moyen foncé' },
  { id: 'dark', color: '#4A2912', label: 'Foncé' },
];

const HAIR_COLORS = [
  { id: 'black', color: '#1A1A1A', label: 'Noir' },
  { id: 'brown', color: '#6B3A2A', label: 'Brun' },
  { id: 'blonde', color: '#D4A843', label: 'Blond' },
  { id: 'auburn', color: '#922B21', label: 'Auburn' },
  { id: 'gray', color: '#A0A0A0', label: 'Gris' },
  { id: 'white', color: '#F0F0F0', label: 'Blanc' },
];

const OUTFITS = [
  { id: 'casual', label: 'Décontracté', icon: '👕' },
  { id: 'formal', label: 'Formel', icon: '👔' },
  { id: 'sport', label: 'Sport', icon: '🏃' },
  { id: 'traditional', label: 'Traditionnel', icon: '🎽' },
];

const SIGNING_SPEEDS = [
  { id: 'slow', label: 'Lent', icon: '🐢', desc: 'Pour l\'apprentissage' },
  { id: 'normal', label: 'Normal', icon: '🚶', desc: 'Conversation courante' },
  { id: 'fast', label: 'Rapide', icon: '⚡', desc: 'Fluide & naturel' },
];

const AVATAR_SIZES = [
  { id: 'small', label: 'Petit', scale: 0.75 },
  { id: 'medium', label: 'Moyen', scale: 1.0 },
  { id: 'large', label: 'Grand', scale: 1.3 },
];

// ─── Section header ───────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Color swatch row ─────────────────────────────────────────
function ColorRow({ options, selected, onSelect }) {
  return (
    <View style={styles.colorRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.id}
          style={[
            styles.colorSwatch,
            { backgroundColor: opt.color },
            selected === opt.id && styles.colorSwatchSelected,
          ]}
          onPress={() => onSelect(opt.id)}
          accessibilityLabel={opt.label}
        >
          {selected === opt.id && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AvatarConfigScreen({ navigation }) {
  const [avatarStyle, setAvatarStyle] = useState(null);
  const [config, setConfig] = useState({
    skinTone: 'medium',
    hairColor: 'brown',
    outfit: 'casual',
    signingSpeed: 'normal',
    avatarSize: 'medium',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0); // forces preview refresh

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setAvatarStyle(data.avatarStyle || 'frezita');
          if (data.avatarConfig) {
            setConfig((prev) => ({ ...prev, ...data.avatarConfig }));
          }
        }
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setPreviewKey((k) => k + 1); // refresh preview
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // MODE DÉMO
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigation.navigate('Home');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  // Build Cloudinary preview URL with transformations
  const previewUrl = getCloudinaryUrl(
    `voxmanus/avatars/${avatarStyle || 'frezita'}_${config.skinTone}_${config.hairColor}`,
    `w_400,h_400,c_fill,q_auto,f_auto`
  );

  const currentSize = AVATAR_SIZES.find((s) => s.id === config.avatarSize);
  const previewSize = 120 * (currentSize?.scale || 1);

  if (loading) {
    return (
      <LinearGradient colors={['#0A0D14', '#0E1526']} style={styles.root}>
        <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Chargement…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0D14', '#0E1526']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Page header */}
          <View style={styles.pageHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Personnaliser mon avatar</Text>
            <TouchableOpacity
              style={styles.changeAvatarBtn}
              onPress={() => navigation.navigate('ChooseAvatar')}
            >
              <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* ── LIVE PREVIEW ── */}
          <View style={styles.previewSection}>
            <View style={styles.previewGlow} />
            <View style={[styles.previewCircle, { width: previewSize + 24, height: previewSize + 24, borderRadius: (previewSize + 24) / 2 }]}>
              {/* Cloudinary 3D avatar */}
              <Image
                key={previewKey}
                source={{ uri: previewUrl }}
                style={{ width: previewSize, height: previewSize, borderRadius: previewSize / 2 }}
                defaultSource={require('../../assets/icon.png')}
              />
              {/* Fallback emoji overlay */}
              <Text style={[styles.previewEmoji, { fontSize: previewSize * 0.45 }]}>
                {avatarStyle === 'frezita' ? '🤙' : '🧑‍💼'}
              </Text>
            </View>
            <View style={styles.previewMeta}>
              <Text style={styles.previewName}>
                {avatarStyle === 'frezita' ? 'FRÉZITA' : 'ALEX'}
              </Text>
              <Text style={styles.previewSub}>
                {avatarStyle === 'frezita' ? 'Alphabet LSF/ASL' : 'Phrases complètes'}
              </Text>
            </View>
            <View style={styles.previewTags}>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>
                  {SKIN_TONES.find(s => s.id === config.skinTone)?.label}
                </Text>
              </View>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>
                  {OUTFITS.find(o => o.id === config.outfit)?.icon} {OUTFITS.find(o => o.id === config.outfit)?.label}
                </Text>
              </View>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>
                  {SIGNING_SPEEDS.find(s => s.id === config.signingSpeed)?.icon} {SIGNING_SPEEDS.find(s => s.id === config.signingSpeed)?.label}
                </Text>
              </View>
            </View>
          </View>

          {/* ── SKIN TONE ── */}
          <View style={styles.section}>
            <SectionHeader icon="color-palette-outline" title="Teinte de peau" />
            <ColorRow
              options={SKIN_TONES}
              selected={config.skinTone}
              onSelect={(v) => updateConfig('skinTone', v)}
            />
          </View>

          {/* ── HAIR COLOR ── */}
          <View style={styles.section}>
            <SectionHeader icon="cut-outline" title="Couleur de cheveux" />
            <ColorRow
              options={HAIR_COLORS}
              selected={config.hairColor}
              onSelect={(v) => updateConfig('hairColor', v)}
            />
          </View>

          {/* ── OUTFIT ── */}
          <View style={styles.section}>
            <SectionHeader icon="shirt-outline" title="Tenue vestimentaire" />
            <View style={styles.optionRow}>
              {OUTFITS.map((opt) => {
                const isSelected = config.outfit === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => updateConfig('outfit', opt.id)}
                  >
                    <Text style={styles.optionEmoji}>{opt.icon}</Text>
                    <Text style={[styles.optionLabel, isSelected && { color: Colors.primary }]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.optionCheck}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── SIGNING SPEED ── */}
          <View style={styles.section}>
            <SectionHeader icon="speedometer-outline" title="Vitesse de signature" />
            {SIGNING_SPEEDS.map((opt) => {
              const isSelected = config.signingSpeed === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.speedRow, isSelected && styles.speedRowSelected]}
                  onPress={() => updateConfig('signingSpeed', opt.id)}
                >
                  <Text style={styles.speedEmoji}>{opt.icon}</Text>
                  <View style={styles.speedInfo}>
                    <Text style={[styles.speedLabel, isSelected && { color: Colors.primary }]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.speedDesc}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── AVATAR SIZE ── */}
          <View style={styles.section}>
            <SectionHeader icon="resize-outline" title="Taille de l'avatar" />
            <View style={styles.sizeRow}>
              {AVATAR_SIZES.map((opt) => {
                const isSelected = config.avatarSize === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.sizeBtn, isSelected && styles.sizeBtnSelected]}
                    onPress={() => updateConfig('avatarSize', opt.id)}
                  >
                    <Text style={[styles.sizeBtnText, isSelected && { color: Colors.primary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── SAVE ── */}
          <View style={styles.saveSection}>
            <PrimaryButton
              title="💾  Sauvegarder"
              onPress={handleSave}
              loading={saving}
              size="large"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { paddingBottom: 48, flexGrow: 1 },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  changeAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderFocus,
  },

  // Preview
  previewSection: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
    marginHorizontal: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryGlow,
    top: -40,
  },
  previewCircle: {
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgInput,
    position: 'relative',
  },
  previewEmoji: {
    position: 'absolute',
    opacity: 0.15,
  },
  previewMeta: {
    alignItems: 'center',
    marginTop: 12,
  },
  previewName: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  previewSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  previewTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewTag: {
    backgroundColor: Colors.bgInput,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTagText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },

  // Sections
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Colors
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },

  // Options (outfit)
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  optionCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: Colors.bgInput,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  optionLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Speed
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 12,
  },
  speedRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  speedEmoji: { fontSize: 22 },
  speedInfo: { flex: 1 },
  speedLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  speedDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  // Size
  sizeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sizeBtn: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sizeBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  sizeBtnText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },

  // Radio
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  saveSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
});
