import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, onSnapshot, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');

export default function ContactDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id: contactId } = route.params || {};

  const [contactMeta, setContactMeta] = useState(null); // fields inside users/{uid}/contacts/{contactId}
  const [contactUser, setContactUser] = useState(null); // fields inside users/{contactId}
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Router bridge
  const router = {
    push: (path) => {
      if (path.startsWith('/contacts/call/')) {
        navigation.navigate('CallScreen', { id: contactId });
      } else if (path.startsWith('/historique')) {
        navigation.navigate('Historique', { contactId });
      }
    },
    back: () => {
      navigation.goBack();
    }
  };

  useEffect(() => {
    if (!contactId) return;

    const uid = auth.currentUser?.uid || 'demo-user-deaf';

    // 1. Listen to contact subcollection meta
    const unsubMeta = onSnapshot(
      doc(db, 'users', uid, 'contacts', contactId),
      (snap) => {
        if (snap.exists()) {
          setContactMeta(snap.data());
        }
      },
      (err) => console.log('Error fetching contact meta', err)
    );

    // 2. Listen to the contact's public profile data (status, role, photoURL, etc.)
    const unsubUser = onSnapshot(
      doc(db, 'users', contactId),
      (snap) => {
        if (snap.exists()) {
          setContactUser(snap.data());
          setLoading(false);
        } else {
          // If no Firestore doc exists yet, use a fallback local data
          setContactUser({
            nom: contactId.includes('martin') ? 'Martin' : contactId.includes('sara') ? 'Sara' : contactId.includes('youssef') ? 'Youssef' : 'Karim',
            prenom: contactId.includes('martin') ? 'Dr.' : contactId.includes('sara') ? 'Amie' : contactId.includes('youssef') ? 'Collègue' : 'Ami',
            role: contactId.includes('martin') ? 'Médecin' : contactId.includes('sara') ? 'Sourd/LSF' : contactId.includes('youssef') ? 'Entendant' : 'Sourd/LSF',
            isOnline: contactId.includes('martin') || contactId.includes('karim'),
            isBusy: contactId.includes('sara'),
            photoURL: null,
          });
          setLoading(false);
        }
      },
      (err) => {
        console.log('Error fetching contact user profile, using fallbacks', err);
        setContactUser({
          nom: contactId.includes('martin') ? 'Martin' : contactId.includes('sara') ? 'Sara' : contactId.includes('youssef') ? 'Youssef' : 'Karim',
          prenom: contactId.includes('martin') ? 'Dr.' : contactId.includes('sara') ? 'Amie' : contactId.includes('youssef') ? 'Collègue' : 'Ami',
          role: contactId.includes('martin') ? 'Médecin' : contactId.includes('sara') ? 'Sourd/LSF' : contactId.includes('youssef') ? 'Entendant' : 'Sourd/LSF',
          isOnline: contactId.includes('martin') || contactId.includes('karim'),
          isBusy: contactId.includes('sara'),
          photoURL: null,
        });
        setLoading(false);
      }
    );

    // 3. Keep track of all contacts to check SOS limit
    const unsubAll = onSnapshot(
      collection(db, 'users', uid, 'contacts'),
      (snap) => {
        setAllContacts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => {
      unsubMeta();
      unsubUser();
      unsubAll();
    };
  }, [contactId]);

  if (loading || !contactUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  const prenom = contactUser.prenom || '';
  const nom = contactUser.nom || '';
  const photoURL = contactUser.photoURL || null;
  const isOnline = !!contactUser.isOnline;
  const isBusy = !!contactUser.isBusy;
  const role = (contactUser.role || 'Autre').toLowerCase();
  
  const isFavorite = contactMeta?.isFavorite || false;
  const isSOS = contactMeta?.isEmergencyContact || false;

  // Initials logic
  const initials = (prenom[0] || '') + (nom[0] || '');

  // Toggle Favorite
  const toggleFavorite = async () => {
    const uid = auth.currentUser?.uid || 'demo-user-deaf';
    try {
      await updateDoc(doc(db, 'users', uid, 'contacts', contactId), {
        isFavorite: !isFavorite,
      });
    } catch (e) {
      console.log('Error toggling favorite', e);
    }
  };

  // Toggle SOS (Max 3 SOS)
  const toggleSOS = async () => {
    const uid = auth.currentUser?.uid || 'demo-user-deaf';
    const existingSOS = allContacts.filter(c => c.isEmergencyContact);

    if (existingSOS.length >= 3 && !isSOS) {
      Alert.alert(
        "Limite SOS",
        "Vous avez déjà 3 contacts SOS. Retirez-en un d'abord."
      );
      return;
    }

    try {
      await updateDoc(doc(db, 'users', uid, 'contacts', contactId), {
        isEmergencyContact: !isSOS,
        sosOrder: isSOS ? null : existingSOS.length + 1
      });
    } catch (e) {
      console.log('Error toggling SOS', e);
    }
  };

  // Delete Contact
  const deleteContact = () => {
    Alert.alert(
      "Supprimer ce contact ?",
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const uid = auth.currentUser?.uid || 'demo-user-deaf';
            try {
              await deleteDoc(doc(db, 'users', uid, 'contacts', contactId));
              router.back();
            } catch (e) {
              console.log('Error deleting contact', e);
            }
          }
        }
      ]
    );
  };

  // Block User
  const blockContact = () => {
    Alert.alert(
      `Bloquer ${prenom} ?`,
      `${prenom} ne pourra plus vous contacter.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Bloquer",
          style: "destructive",
          onPress: async () => {
            const uid = auth.currentUser?.uid || 'demo-user-deaf';
            try {
              await updateDoc(doc(db, 'users', uid, 'contacts', contactId), {
                isBlocked: true,
              });
              router.back();
            } catch (e) {
              console.log('Error blocking contact', e);
            }
          }
        }
      ]
    );
  };

  // Share profile
  const shareProfile = async () => {
    try {
      await Share.share({
        message: `Rejoignez-moi sur SignBridge ! Mon profil : signbridge://user/${contactId}`,
        title: `Profil de ${prenom} ${nom}`
      });
    } catch (e) {
      console.log('Error sharing profile', e);
    }
  };

  // Status Badge Rendering
  const renderStatus = () => {
    if (isOnline) {
      return (
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: '#00C853' }]}>● En ligne</Text>
        </View>
      );
    } else if (isBusy) {
      return (
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: '#FF9800' }]}>◐ Occupé</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: '#9E9E9E' }]}>○ Hors ligne</Text>
        </View>
      );
    }
  };

  // Role Badge Styling
  const renderRoleBadge = () => {
    if (role === 'hearing' || role === 'entendant') {
      return (
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,193,7,0.2)' }]}>
          <Text style={[styles.roleBadgeText, { color: '#FFC107' }]}>Entendant</Text>
        </View>
      );
    } else if (role === 'deaf' || role === 'sourd' || role === 'sourd/lsf') {
      return (
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(0,200,83,0.2)' }]}>
          <Text style={[styles.roleBadgeText, { color: '#00C853' }]}>Sourd/LSF</Text>
        </View>
      );
    } else if (role === 'doctor' || role === 'médecin' || role === 'medecin') {
      return (
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(33,150,243,0.2)' }]}>
          <Text style={[styles.roleBadgeText, { color: '#2196F3' }]}>Médecin</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(158,158,158,0.2)' }]}>
          <Text style={[styles.roleBadgeText, { color: '#9E9E9E' }]}>{contactUser.role || 'Autre'}</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={router.back}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header blurred photo background */}
        <View style={styles.header}>
          {photoURL ? (
            <Image
              source={{ uri: photoURL }}
              style={styles.headerBgImage}
              blurRadius={30}
            />
          ) : (
            <View style={[styles.headerBgImage, { backgroundColor: '#0A0D14' }]} />
          )}

          {/* Centered Profile Data */}
          <View style={styles.profileContainer}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatarLarge} />
            ) : (
              <View style={styles.avatarPlaceholderLarge}>
                <Text style={styles.avatarPlaceholderInitials}>{initials.toUpperCase() || 'SB'}</Text>
              </View>
            )}

            <Text style={styles.nameText}>{prenom} {nom}</Text>
            {renderStatus()}
            <View style={styles.roleContainer}>
              {renderRoleBadge()}
            </View>
          </View>
        </View>

        {/* Primary Call Button */}
        <View style={styles.callWrapper}>
          <TouchableOpacity
            style={[styles.callBtnFull, (!isOnline && !isBusy) && styles.callBtnOffline]}
            onPress={() => router.push(`/contacts/call/${contactId}`)}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={22} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Appeler {prenom}</Text>
          </TouchableOpacity>
          {(!isOnline && !isBusy) && (
            <Text style={styles.offlineSubtext}>○ {prenom} est hors ligne</Text>
          )}
        </View>

        {/* Other Options Row List */}
        <View style={styles.optionsWrapper}>
          <Text style={styles.optionsSectionTitle}>AUTRES OPTIONS</Text>

          {/* Option: Voir l'historique */}
          <TouchableOpacity style={styles.optionRow} onPress={() => router.push(`/historique`)}>
            <View style={styles.optionLeft}>
              <Ionicons name="document-text-outline" size={22} color="#9E9E9E" style={styles.optionIcon} />
              <Text style={styles.optionLabel}>Voir l'historique</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          {/* Option: Ajouter aux favoris */}
          <TouchableOpacity style={styles.optionRow} onPress={toggleFavorite}>
            <View style={styles.optionLeft}>
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={22}
                color={isFavorite ? "#FFC107" : "#9E9E9E"}
                style={styles.optionIcon}
              />
              <Text style={styles.optionLabel}>
                {isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          {/* Option: SOS */}
          <TouchableOpacity style={styles.optionRow} onPress={toggleSOS}>
            <View style={styles.optionLeft}>
              <Ionicons
                name="shield"
                size={22}
                color={isSOS ? "#F44336" : "#9E9E9E"}
                style={styles.optionIcon}
              />
              <Text style={styles.optionLabel}>
                {isSOS ? "Retirer du SOS" : "Définir comme contact SOS"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          {/* Option: Partager le profil */}
          <TouchableOpacity style={styles.optionRow} onPress={shareProfile}>
            <View style={styles.optionLeft}>
              <Ionicons name="share-social-outline" size={22} color="#9E9E9E" style={styles.optionIcon} />
              <Text style={styles.optionLabel}>Partager le profil</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          {/* Option: Supprimer le contact */}
          <TouchableOpacity style={styles.optionRow} onPress={deleteContact}>
            <View style={styles.optionLeft}>
              <Ionicons name="trash-outline" size={22} color="#F44336" style={styles.optionIcon} />
              <Text style={[styles.optionLabel, { color: '#F44336' }]}>Supprimer le contact</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          {/* Option: Bloquer cet utilisateur */}
          <TouchableOpacity style={[styles.optionRow, styles.optionRowLast]} onPress={blockContact}>
            <View style={styles.optionLeft}>
              <Ionicons name="ban-outline" size={22} color="#F44336" style={styles.optionIcon} />
              <Text style={[styles.optionLabel, { color: '#F44336' }]}>Bloquer cet utilisateur</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    height: 220,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 220,
    opacity: 0.25,
  },
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#00C853',
  },
  avatarPlaceholderLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholderInitials: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  statusRow: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  roleContainer: {
    marginTop: 8,
  },
  roleBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Call full-width button
  callWrapper: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  callBtnFull: {
    flexDirection: 'row',
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callBtnOffline: {
    opacity: 0.5,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  offlineSubtext: {
    color: '#9E9E9E',
    fontSize: 13,
    marginTop: 8,
  },
  // Options rows list
  optionsWrapper: {
    marginTop: 24,
  },
  optionsSectionTitle: {
    color: '#9E9E9E',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 24,
    marginRight: 12,
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
