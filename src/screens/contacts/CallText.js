import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../../theme/colors';

export default function CallText({ contact }) {
  const [session, setSession] = useState(null);
  const [code, setCode] = useState('');

  const createCall = () => {
    // Mode Démo
    setSession('ABC-123');
  };

  if (session) {
    return (
      <View style={styles.activeCallContainer}>
        <Text style={styles.sessionCode}>{session}</Text>
        <Text style={styles.statusText}>📡 Envoi vers {contact ? contact.name : 'le destinataire'}...</Text>
        
        <View style={styles.activeBox}>
          <Text style={styles.demoText}>L'appel texte est en cours... (Mode Démo)</Text>
        </View>

        <TouchableOpacity style={styles.endBtn} onPress={() => setSession(null)}>
          <Text style={styles.endBtnText}>Terminer l'appel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Créer un appel</Text>
        <Text style={styles.cardDesc}>Génère un code à partager</Text>
        <TouchableOpacity style={styles.createBtn} onPress={createCall}>
          <Text style={styles.createBtnText}>+ Créer un appel</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.or}>OU</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rejoindre un appel</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Code (ex: ABC-123)" 
          placeholderTextColor="#6b7280"
          value={code}
          onChangeText={setCode}
        />
        <TouchableOpacity style={styles.joinBtn} onPress={() => setSession(code || 'XXX-000')}>
          <Text style={styles.joinBtnText}>Rejoindre l'appel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  cardDesc: { color: '#9ca3af', fontSize: 14, marginBottom: 20 },
  createBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  or: { color: '#6b7280', textAlign: 'center', marginVertical: 24, fontWeight: 'bold' },
  input: {
    backgroundColor: '#374151',
    width: '100%',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  joinBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  activeCallContainer: { flex: 1, alignItems: 'center', padding: 24 },
  sessionCode: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 40 },
  statusText: { color: '#22c55e', fontSize: 16, marginTop: 8 },
  activeBox: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  demoText: { color: '#9ca3af', fontSize: 18, textAlign: 'center' },
  endBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  endBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
