import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../theme/colors';

export default function Step2Photo({ formData, updateForm, onNext }) {
  const [loading, setLoading] = useState(false);

  const requestPermission = async (type) => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const pickFromGallery = async () => {
    const ok = await requestPermission('gallery');
    if (!ok) {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie dans les paramètres.");
      return;
    }
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        updateForm({ photoURL: result.assets[0].uri });
      }
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const ok = await requestPermission('camera');
    if (!ok) {
      Alert.alert('Permission requise', "Autorisez l'accès à la caméra dans les paramètres.");
      return;
    }
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        updateForm({ photoURL: result.assets[0].uri });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.hint}>Ajoutez votre photo (optionnel)</Text>

      {/* Avatar circle */}
      <View style={styles.avatarContainer}>
        {formData.photoURL ? (
          <Image source={{ uri: formData.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarDefault}>
            <Ionicons name="person" size={64} color={Colors.primary} />
          </View>
        )}
        {formData.photoURL && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => updateForm({ photoURL: null })}
          >
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionCard} onPress={takePhoto}>
          <View style={styles.actionIcon}>
            <Ionicons name="camera" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Prendre une photo</Text>
          <Text style={styles.actionSub}>Utiliser la caméra</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={pickFromGallery}>
          <View style={styles.actionIcon}>
            <Ionicons name="images" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Galerie</Text>
          <Text style={styles.actionSub}>Choisir une image</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Continuer →"
          onPress={onNext}
          loading={loading}
        />
        <TouchableOpacity style={styles.skipLink} onPress={onNext}>
          <Text style={styles.skipText}>Passer cette étape</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: 'center',
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarDefault: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.bg,
    borderRadius: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionSub: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  skipLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
