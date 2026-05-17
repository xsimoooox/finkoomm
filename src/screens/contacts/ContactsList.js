import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

const MOCK_CONTACTS = [
  { id: '1', name: 'Dr. Martin', role: 'Médecin', isEmergency: true, type: 'medical' },
  { id: '2', name: 'Sara', role: 'Amie', isEmergency: false, type: 'deaf' },
  { id: '3', name: 'Youssef', role: 'Collègue', isEmergency: false, type: 'hearing' },
];

export default function ContactsList({ onAction }) {
  const [search, setSearch] = useState('');

  const renderContact = (contact) => {
    let dotColor = '#6b7280';
    if (contact.type === 'medical') dotColor = '#3b82f6'; // bleu
    else if (contact.type === 'deaf') dotColor = '#22c55e'; // vert
    else if (contact.type === 'hearing') dotColor = '#eab308'; // or

    return (
      <TouchableOpacity key={contact.id} style={styles.contactCard} activeOpacity={0.8}>
        <View style={styles.contactInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{contact.name.charAt(0)}</Text>
            {contact.isEmergency && <View style={styles.sosBadge} />}
          </View>
          <View>
            <Text style={styles.contactName}>{contact.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
              <Text style={styles.contactRole}>{contact.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('AudioText', contact)}>
            <Ionicons name="mic" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('CallText', contact)}>
            <Ionicons name="call" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onAction('Avatar', contact)}>
            <Ionicons name="hand-right" size={16} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const emergencyContacts = MOCK_CONTACTS.filter(c => c.isEmergency);
  const otherContacts = MOCK_CONTACTS.filter(c => !c.isEmergency);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un contact..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.sectionTitle}>CONTACTS D'URGENCE</Text>
      {emergencyContacts.map(renderContact)}

      <Text style={styles.sectionTitle}>MES CONTACTS</Text>
      {otherContacts.map(renderContact)}

      <TouchableOpacity style={styles.addBtn}>
        <Text style={styles.addBtnText}>+ Ajouter un contact</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 12,
    marginTop: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  sosBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  contactName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactRole: {
    color: '#9ca3af',
    fontSize: 13,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
