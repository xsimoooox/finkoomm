import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { FRIZITTA_DICTIONARY } from '../../data/frizittaDictionary';
import { ALEX_DICTIONARY } from '../../data/alexDictionary';
import { Colors } from '../../theme/colors';

export default function AvatarTranslator({ contact }) {
  const [avatar, setAvatar] = useState(null); // 'frizitta' | 'alex' | null
  const [text, setText] = useState('');
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sequence, setSequence] = useState([]);

  // Logique simplifiée pour la démo : transformation du texte en séquence
  const handleTranslate = () => {
    if (!text.trim()) return;
    setPlaying(true);
    setCurrentIndex(0);

    if (avatar === 'frizitta') {
      const chars = text.toUpperCase().split('');
      const newSeq = chars.map(c => {
        if (FRIZITTA_DICTIONARY[c]) return { type: 'img', src: FRIZITTA_DICTIONARY[c], char: c };
        return { type: 'img', src: FRIZITTA_DICTIONARY['NEUTRE'], char: ' ' };
      });
      setSequence(newSeq);
    } else {
      const words = text.toUpperCase().split(/\s+/);
      const newSeq = words.map(w => {
        const cleanWord = w.replace(/[^A-Z0-9-_]/g, '');
        if (!cleanWord) return null;
        const found = ALEX_DICTIONARY.find(item =>
          item.original.toUpperCase() === cleanWord ||
          item.synonymes?.map(s => s.toUpperCase()).includes(cleanWord)
        );
        if (found) return { type: 'video', src: found.url, word: cleanWord };
        return null;
      }).filter(Boolean);
      setSequence(newSeq);
    }
  };

  useEffect(() => {
    if (playing && sequence.length > 0 && avatar === 'frizitta') {
      const timer = setTimeout(() => {
        if (currentIndex < sequence.length - 1) setCurrentIndex(prev => prev + 1);
        else setPlaying(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [playing, currentIndex, sequence, avatar]);

  if (!avatar) {
    return (
      <View style={styles.selContainer}>
        <Text style={styles.selTitle}>Choisissez votre Avatar</Text>

        <TouchableOpacity style={styles.selCard} onPress={() => setAvatar('frizitta')}>
          <Text style={styles.avatarName}>🖐 FRIZITTA</Text>
          <Text style={styles.avatarDesc}>Avatar des lettres</Text>
          <Text style={styles.avatarInfo}>• Épelle lettre par lettre (ASL){'\n'}• Idéal pour noms et codes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.selCard} onPress={() => setAvatar('alex')}>
          <Text style={styles.avatarName}>🎬 ALEX</Text>
          <Text style={styles.avatarDesc}>Avatar des mots</Text>
          <Text style={styles.avatarInfo}>• Signe des mots entiers{'\n'}• Idéal pour les conversations</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentMedia = sequence[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setAvatar(null)}>
          <Text style={styles.changeBtn}>Changer</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{avatar === 'frizitta' ? '🖐 Frizitta' : '🎬 Alex'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.avatarZone}>
        <View style={styles.avatarInner}>
          {playing && currentMedia ? (
            avatar === 'frizitta' ? (
              <Image source={{ uri: currentMedia.src }} style={styles.media} resizeMode="contain" />
            ) : (
              <Video
                source={{ uri: currentMedia.src }}
                style={styles.media}
                resizeMode="cover"
                shouldPlay
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish) {
                    if (currentIndex < sequence.length - 1) setCurrentIndex(prev => prev + 1);
                    else setPlaying(false);
                  }
                }}
              />
            )
          ) : (
            <Text style={{ color: '#9ca3af' }}>En attente de traduction...</Text>
          )}
        </View>
        {playing && currentMedia && (
          <Text style={styles.progressText}>
            En cours : {currentMedia.char || currentMedia.word} | {currentIndex + 1}/{sequence.length}
          </Text>
        )}
      </View>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Texte à traduire..."
          placeholderTextColor="#6b7280"
          value={text}
          onChangeText={setText}
          multiline
        />
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.micBtn}>
            <Ionicons name="mic" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.translateBtn} onPress={handleTranslate}>
            <Text style={styles.translateText}>▶ Traduire en LSF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  selTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  selCard: { backgroundColor: '#1f2937', borderRadius: 16, padding: 20, marginBottom: 16 },
  avatarName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  avatarDesc: { color: '#22c55e', fontSize: 14, marginBottom: 12 },
  avatarInfo: { color: '#9ca3af', lineHeight: 22 },

  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  changeBtn: { color: '#3b82f6', fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  avatarZone: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: '100%', aspectRatio: 9 / 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  media: { width: '100%', height: '100%' },
  progressText: { color: '#fff', marginTop: 12, fontWeight: 'bold' },

  inputArea: { padding: 16, backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: '#1f2937' },
  input: { backgroundColor: '#374151', borderRadius: 12, padding: 16, color: '#fff', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  controlsRow: { flexDirection: 'row' },
  micBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  translateBtn: { flex: 1, backgroundColor: '#22c55e', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  translateText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
