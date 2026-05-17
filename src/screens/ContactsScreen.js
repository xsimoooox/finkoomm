import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Colors } from '../theme/colors';

import ContactsList from './contacts/ContactsList';
import AudioText from './contacts/AudioText';
import CallText from './contacts/CallText';
import AvatarTranslator from './contacts/AvatarTranslator';

export default function ContactsScreen() {
  const [activeTab, setActiveTab] = useState('Contacts');
  const [selectedContact, setSelectedContact] = useState(null);

  const handleAction = (tabName, contact) => {
    setSelectedContact(contact);
    setActiveTab(tabName);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Contacts':
        return <ContactsList onAction={handleAction} />;
      case 'AudioText':
        return <AudioText contact={selectedContact} />;
      case 'CallText':
        return <CallText contact={selectedContact} />;
      case 'Avatar':
        return <AvatarTranslator contact={selectedContact} />;
      default:
        return <ContactsList onAction={handleAction} />;
    }
  };

  const tabs = [
    { id: 'Contacts', label: '👥 Contacts' },
    { id: 'AudioText', label: '🎙 Audio Texte' },
    { id: 'CallText', label: '📞 Appel Texte' },
    { id: 'Avatar', label: '🤟 Avatar' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id === 'Contacts') setSelectedContact(null);
              }}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    paddingTop: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#22c55e',
  },
  tabText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#22c55e',
  },
  content: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
