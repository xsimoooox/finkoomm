import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { rtdb } from '../../config/firebase';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { useWebSpeech } from '../../hooks/useWebSpeech';

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 2) result += '-';
  }
  return result;
};

export default function CallText({ contact, autoJoinCode }) {
  const [role, setRole] = useState(null); // 'speaker' | 'reader' | null
  const [session, setSession] = useState(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (autoJoinCode) {
      setCode(autoJoinCode);
      // We don't auto-join yet because the user needs to select their role.
      // Or we can assume they are joining as 'reader' if they click from notification?
      // "Personne B = celle qui NE PARLE PAS (sourde / malentendante) -> reçoit une notif"
      // If they get a notif, they are likely the reader. Let's default to reader if autoJoinCode.
      setRole('reader');
      setSession(autoJoinCode);
    }
  }, [autoJoinCode]);
  
  // Speaker state
  const { isListening, interimText, finalText, startListening, stopListening, resetText, supported } = useWebSpeech();
  const [language, setLanguage] = useState('fr-FR');
  
  // Reader state
  const [remoteData, setRemoteData] = useState({ text: '', interim: '', isSpeaking: false });

  // Handle speaker updates to RTDB
  useEffect(() => {
    if (role === 'speaker' && session) {
      const callRef = ref(rtdb, `calls/${session}`);
      set(callRef, {
        text: finalText,
        interim: interimText,
        isSpeaking: isListening,
        timestamp: Date.now()
      });
      
      // Clear connection state on disconnect
      onDisconnect(callRef).update({ isSpeaking: false });
    }
  }, [role, session, isListening, interimText, finalText]);

  // Handle reader updates from RTDB
  useEffect(() => {
    if (role === 'reader' && session) {
      const callRef = ref(rtdb, `calls/${session}`);
      const unsubscribe = onValue(callRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRemoteData({
            text: data.text || '',
            interim: data.interim || '',
            isSpeaking: !!data.isSpeaking
          });
        }
      });
      return () => unsubscribe();
    }
  }, [role, session]);

  const startNewCall = (selectedRole) => {
    const newCode = generateCode();
    setRole(selectedRole);
    setSession(newCode);
    
    // Si c'est pour un contact spécifique, ici on enverrait la notif (voir TODO Firebase Cloud Messaging)
    if (contact) {
      // Send notification to contact
      // pushNotification(contact.id, newCode)
    }
  };

  const joinCall = (selectedRole) => {
    if (code.length >= 6) {
      setRole(selectedRole);
      setSession(code.toUpperCase());
    }
  };

  const copyText = async () => {
    const textToCopy = role === 'speaker' ? finalText : remoteData.text;
    if (textToCopy) {
      await Clipboard.setStringAsync(textToCopy);
      alert('Texte copié !');
    }
  };

  const clearScreen = () => {
    if (role === 'speaker') {
      resetText();
    }
    // Pour le reader on pourrait juste réinitialiser la vue locale, mais ici on garde le remote
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(language);
    }
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Choisissez votre rôle</Text>
        
        <View style={styles.roleSelection}>
          <TouchableOpacity style={styles.roleBtn} onPress={() => startNewCall('speaker')}>
            <Ionicons name="mic" size={32} color="#fff" />
            <Text style={styles.roleBtnText}>Je parle</Text>
            <Text style={styles.roleSub}>Je suis entendant</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.roleBtn, styles.roleBtnReader]} onPress={() => startNewCall('reader')}>
            <Ionicons name="eye" size={32} color="#fff" />
            <Text style={styles.roleBtnText}>Je lis</Text>
            <Text style={styles.roleSub}>Je suis sourd(e)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.or}>OU REJOINDRE</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrez un code</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: ABC-123" 
            placeholderTextColor="#6b7280"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
          <View style={styles.rowBtn}>
            <TouchableOpacity style={styles.joinBtnSmall} onPress={() => joinCall('speaker')}>
              <Text style={styles.joinBtnText}>Rejoindre (Parler)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.joinBtnSmall, { backgroundColor: '#8b5cf6' }]} onPress={() => joinCall('reader')}>
              <Text style={styles.joinBtnText}>Rejoindre (Lire)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sessionLabel}>Code Appel</Text>
          <Text style={styles.sessionCodeHeader}>{session}</Text>
        </View>
        <TouchableOpacity style={styles.endBtn} onPress={() => {
          if (role === 'speaker') stopListening();
          setSession(null);
          setRole(null);
        }}>
          <Text style={styles.endBtnText}>Quitter</Text>
        </TouchableOpacity>
      </View>

      {role === 'speaker' ? (
        <View style={styles.activeCallContainer}>
          <View style={styles.langSelector}>
            <Text style={styles.langLabel}>Langue : </Text>
            {['fr-FR', 'ar-MA', 'en-US'].map(l => (
              <TouchableOpacity 
                key={l} 
                style={[styles.langBtn, language === l && styles.langBtnActive]}
                onPress={() => setLanguage(l)}
              >
                <Text style={styles.langBtnText}>{l.split('-')[0].toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.textDisplay} contentContainerStyle={{flexGrow:1}}>
            <Text style={styles.finalText}>{finalText}</Text>
            <Text style={styles.interimText}>{interimText}</Text>
          </ScrollView>

          {!supported && <Text style={{color:'red', marginBottom:10}}>Web Speech API non supporté sur ce navigateur.</Text>}

          <TouchableOpacity 
            style={[styles.micBtn, isListening && styles.micBtnActive]} 
            onPress={toggleListening}
          >
            <Ionicons name={isListening ? "mic" : "mic-off"} size={48} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.micHint}>
            {isListening ? "Enregistrement en cours... Touchez pour arrêter" : "Touchez pour parler"}
          </Text>
        </View>
      ) : (
        <View style={styles.activeCallContainer}>
          <View style={styles.readerHeader}>
            {remoteData.isSpeaking ? (
              <Text style={styles.speakingIndicator}>L'interlocuteur parle...</Text>
            ) : (
              <Text style={styles.waitingIndicator}>En attente...</Text>
            )}
            
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={copyText}>
                <Ionicons name="copy-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={clearScreen}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.textDisplayReader} contentContainerStyle={{flexGrow:1}}>
            <Text style={styles.finalTextReader}>{remoteData.text}</Text>
            <Text style={styles.interimTextReader}>{remoteData.interim}</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0a0a0a', justifyContent: 'center' },
  mainTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  roleSelection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  roleBtn: {
    backgroundColor: '#3b82f6',
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#60a5fa'
  },
  roleBtnReader: {
    backgroundColor: '#8b5cf6',
    borderColor: '#a78bfa'
  },
  roleBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  roleSub: { color: '#e5e7eb', fontSize: 12, marginTop: 4 },
  or: { color: '#6b7280', textAlign: 'center', marginVertical: 16, fontWeight: 'bold' },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: {
    backgroundColor: '#374151',
    width: '100%',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 2,
    fontWeight: 'bold'
  },
  rowBtn: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  joinBtnSmall: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  joinBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  // Active Call Styles
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 20 },
  sessionLabel: { color: '#9ca3af', fontSize: 12, textTransform: 'uppercase' },
  sessionCodeHeader: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  endBtn: { backgroundColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  endBtnText: { color: '#fff', fontWeight: 'bold' },
  
  activeCallContainer: { flex: 1, alignItems: 'center' },
  langSelector: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, alignSelf: 'flex-start' },
  langLabel: { color: '#9ca3af', marginRight: 8 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#374151', marginRight: 8 },
  langBtnActive: { backgroundColor: '#22c55e' },
  langBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  textDisplay: { width: '100%', backgroundColor: '#111827', borderRadius: 16, padding: 16, flex: 1, marginBottom: 20 },
  textDisplayReader: { width: '100%', backgroundColor: '#111827', borderRadius: 16, padding: 24, flex: 1, marginBottom: 20 },
  
  finalText: { color: '#fff', fontSize: 20, lineHeight: 30 },
  interimText: { color: '#9ca3af', fontSize: 20, lineHeight: 30 },
  
  finalTextReader: { color: '#fff', fontSize: 28, lineHeight: 40, fontWeight: '600' },
  interimTextReader: { color: '#9ca3af', fontSize: 28, lineHeight: 40, fontStyle: 'italic' },
  
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  micBtnActive: {
    backgroundColor: '#ef4444',
    transform: [{ scale: 1.1 }],
    // box-shadow or glow could be added here
  },
  micHint: { color: '#9ca3af', fontSize: 14, marginBottom: 20 },
  
  readerHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 12 },
  speakingIndicator: { color: '#22c55e', fontSize: 16, fontWeight: 'bold' },
  waitingIndicator: { color: '#6b7280', fontSize: 16 },
  actionRow: { flexDirection: 'row' },
  actionBtn: { backgroundColor: '#374151', padding: 8, borderRadius: 8, marginLeft: 8 },
});
