import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, onSnapshot, doc, getDocs, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const { width } = Dimensions.get('window');

// --- Real-time status sub-component ---
function ContactCard({ contact, isEmergency, router }) {
  const [status, setStatus] = useState(contact.status || 'offline');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!contact.id) return;
    const unsub = onSnapshot(
      doc(db, 'users', contact.id),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.isOnline) setStatus('online');
          else if (data.isBusy) setStatus('busy');
          else setStatus('offline');
        }
      },
      (err) => {
        console.log('Error fetching status for contact', contact.id, err);
      }
    );
    return () => unsub();
  }, [contact.id]);

  useEffect(() => {
    if (status === 'online') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.8, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const initials = ((contact.prenom || '')[0] || '') + ((contact.nom || '')[0] || '');

  // Role Badge Styling
  const renderBadge = () => {
    if (isEmergency) {
      const orderLabel = contact.sosOrder ? `SOS N°${contact.sosOrder}` : 'SOS N°1';
      return (
        <View style={styles.sosBadge}>
          <Text style={styles.sosBadgeText}>{orderLabel}</Text>
        </View>
      );
    }

    const role = (contact.role || '').toLowerCase();
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
          <Text style={[styles.roleBadgeText, { color: '#9E9E9E' }]}>{contact.role || 'Autre'}</Text>
        </View>
      );
    }
  };

  // Status rendering
  const renderStatus = () => {
    if (status === 'online') {
      return (
        <View style={styles.statusRow}>
          <Animated.View style={[styles.statusDot, { backgroundColor: '#00C853', transform: [{ scale: pulseAnim }] }]} />
          <Text style={[styles.statusText, { color: '#00C853' }]}>En ligne</Text>
        </View>
      );
    } else if (status === 'busy') {
      return (
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: '#FF9800' }]} />
          <Text style={[styles.statusText, { color: '#FF9800' }]}>Occupé</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: '#666666' }]} />
          <Text style={[styles.statusText, { color: '#666666' }]}>Hors ligne</Text>
        </View>
      );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/contacts/${contact.id}`)}
      style={[
        styles.card,
        isEmergency ? styles.cardSOS : styles.cardNormal
      ]}
    >
      <View style={styles.cardLeft}>
        {contact.photoURL ? (
          <Image source={{ uri: contact.photoURL }} style={[styles.avatar, isEmergency && styles.avatarSOS]} />
        ) : (
          <View style={[styles.avatarPlaceholder, isEmergency ? styles.avatarPlaceholderSOS : styles.avatarPlaceholderNormal]}>
            <Text style={styles.avatarInitials}>{initials.toUpperCase() || 'SB'}</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.fullName} numberOfLines={1}>
            {contact.prenom || ''} {contact.nom || ''}
          </Text>
          <View style={styles.badgeContainer}>
            {renderBadge()}
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        {renderStatus()}
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => router.push(`/contacts/call/${contact.id}`)}
        >
          <Ionicons name="call" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// --- Main ContactsList Component ---
export default function ContactsList({ onAction }) {
  const navigation = useNavigation();
  const [allContacts, setAllContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Router bridge
  const router = {
    push: (path) => {
      if (path.startsWith('/contacts/call/')) {
        const id = path.split('/').pop();
        navigation.navigate('CallScreen', { id });
      } else if (path.startsWith('/contacts/')) {
        const id = path.split('/').pop();
        if (id === 'add') {
          // Fallback or navigate to Add Contact if it exists
          navigation.navigate('ChooseAvatar'); // Or add screen if designed
        } else {
          navigation.navigate('ContactDetail', { id });
        }
      }
    }
  };

  // Seed default demo data if Firestore collection is empty
  const seedDemoData = async (uid) => {
    const demoContacts = [
      { id: 'demo-contact-martin', nom: 'Martin', prenom: 'Dr.', role: 'Médecin', isEmergencyContact: true, sosOrder: 1, isBlocked: false, isFavorite: true, isOnline: true, photoURL: null },
      { id: 'demo-contact-sara', nom: 'Sara', prenom: 'Amie', role: 'Sourd/LSF', isEmergencyContact: true, sosOrder: 2, isBlocked: false, isFavorite: true, isBusy: true, photoURL: null },
      { id: 'demo-contact-youssef', nom: 'Youssef', prenom: 'Collègue', role: 'Entendant', isEmergencyContact: false, isBlocked: false, isFavorite: false, isOffline: true, photoURL: null },
      { id: 'demo-contact-karim', nom: 'Karim', prenom: 'Sourd', role: 'Sourd/LSF', isEmergencyContact: false, isBlocked: false, isFavorite: false, isOnline: true, photoURL: null },
    ];

    try {
      for (const contact of demoContacts) {
        await setDoc(doc(db, 'users', uid, 'contacts', contact.id), contact);
        // Also ensure user profile has statuses
        await setDoc(doc(db, 'users', contact.id), {
          nom: contact.nom,
          prenom: contact.prenom,
          isOnline: contact.isOnline || false,
          isBusy: contact.isBusy || false,
          profileType: contact.role === 'Sourd/LSF' ? 'deaf' : 'hearing'
        }, { merge: true });
      }
      console.log('Demo contacts successfully seeded to Firestore!');
    } catch (e) {
      console.log('Error seeding demo data:', e);
    }
  };

  useEffect(() => {
    const uid = auth.currentUser?.uid || 'demo-user-deaf';

    const q = query(
      collection(db, 'users', uid, 'contacts'),
      where('isBlocked', '==', false)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          // If Firestore is empty, seed with rich demo data so it works immediately
          await seedDemoData(uid);
        } else {
          setAllContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        }
      },
      (err) => {
        console.log('Error fetching contacts in real-time, loading local fallbacks:', err);
        // Load offline demo fallbacks on error (e.g. permissions or internet offline)
        const mockContacts = [
          { id: 'demo-contact-martin', nom: 'Martin', prenom: 'Dr.', role: 'Médecin', isEmergencyContact: true, sosOrder: 1, isBlocked: false, isFavorite: true, status: 'online', photoURL: null },
          { id: 'demo-contact-sara', nom: 'Sara', prenom: 'Amie', role: 'Sourd/LSF', isEmergencyContact: true, sosOrder: 2, isBlocked: false, isFavorite: true, status: 'busy', photoURL: null },
          { id: 'demo-contact-youssef', nom: 'Youssef', prenom: 'Collègue', role: 'Entendant', isEmergencyContact: false, isBlocked: false, isFavorite: false, status: 'offline', photoURL: null },
          { id: 'demo-contact-karim', nom: 'Karim', prenom: 'Sourd', role: 'Sourd/LSF', isEmergencyContact: false, isBlocked: false, isFavorite: false, status: 'online', photoURL: null },
        ];
        setAllContacts(mockContacts);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter query logic (prenom + nom + role)
  const filteredContacts = allContacts.filter((contact) => {
    const queryStr = searchQuery.toLowerCase();
    const fullName = `${contact.prenom || ''} ${contact.nom || ''}`.toLowerCase();
    const role = (contact.role || '').toLowerCase();
    return fullName.includes(queryStr) || role.includes(queryStr);
  });

  const emergencyContacts = filteredContacts.filter((c) => c.isEmergencyContact);
  const normalContacts = filteredContacts.filter((c) => !c.isEmergencyContact);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={styles.loadingText}>Chargement des contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar (Sticky at Top) */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#00C853" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un contact..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {allContacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#666666" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Aucun contact pour l'instant</Text>
            <Text style={styles.emptySubtitle}>Demandez à vos proches de rejoindre SignBridge</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/contacts/add')}>
              <Text style={styles.addBtnText}>+ Ajouter un contact</Text>
            </TouchableOpacity>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>
              Aucun contact trouvé pour "{searchQuery}"
            </Text>
          </View>
        ) : (
          <>
            {/* EMERGENCY CONTACTS */}
            {emergencyContacts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>CONTACTS D'URGENCE</Text>
                {emergencyContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isEmergency={true}
                    router={router}
                  />
                ))}
              </View>
            )}

            {/* NORMAL CONTACTS */}
            {normalContacts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>MES CONTACTS</Text>
                {normalContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isEmergency={false}
                    router={router}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
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
  loadingText: {
    color: '#9E9E9E',
    marginTop: 12,
    fontSize: 14,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D0D0D',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#9E9E9E',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Card styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    marginVertical: 4,
    marginHorizontal: 12,
    padding: 12,
  },
  cardSOS: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  cardNormal: {
    backgroundColor: '#1A1A1A',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  avatarSOS: {
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.25)',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderSOS: {
    backgroundColor: '#F44336',
  },
  avatarPlaceholderNormal: {
    backgroundColor: '#374151',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  fullName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  sosBadge: {
    backgroundColor: 'rgba(244,67,54,0.25)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sosBadgeText: {
    color: '#F44336',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  roleBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 52,
    paddingVertical: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666666',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  addBtn: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noResultsText: {
    color: '#666666',
    fontSize: 15,
  },
});
