import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

export default function AudioText({ contact }) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'fr-FR'; // Par défaut

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) setFinalText((prev) => prev + final);
          setInterimText(interim);
        };

        recognition.onerror = (e) => {
          console.error("Speech recognition error", e);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est supportée que sur navigateur web pour le moment.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInterimText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const clearText = () => {
    setFinalText('');
    setInterimText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {contact ? (
          <Text style={styles.headerTitle}>🎙 {contact.name} parle...</Text>
        ) : (
          <Text style={styles.headerTitle}>🎙 Transcription libre</Text>
        )}
        <View style={styles.langSelector}>
          <Text style={styles.langText}>FR</Text>
        </View>
      </View>

      <ScrollView style={styles.textContainer} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.finalText}>{finalText}</Text>
        <Text style={styles.interimText}>{interimText}</Text>
        {!finalText && !interimText && !isListening && (
          <Text style={styles.placeholder}>Appuyez sur Démarrer pour écouter...</Text>
        )}
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.mainBtn, isListening ? styles.stopBtn : styles.startBtn]} 
          onPress={toggleListening}
        >
          <Ionicons name={isListening ? "stop" : "play"} size={20} color="#fff" />
          <Text style={styles.btnText}>{isListening ? "Arrêter" : "Démarrer"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="copy-outline" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconBtn} onPress={clearText}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  langSelector: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  finalText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 34,
  },
  interimText: {
    color: '#9ca3af',
    fontSize: 24,
    lineHeight: 34,
  },
  placeholder: {
    color: '#6b7280',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    alignItems: 'center',
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 12,
  },
  startBtn: { backgroundColor: '#22c55e' },
  stopBtn: { backgroundColor: '#ef4444' },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  iconBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#374151',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
