import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Vibration,
  ActivityIndicator,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Video, ResizeMode } from 'expo-av';
import * as Speech from 'expo-speech';
import { auth, db } from '../../config/firebase';
import { useGlove } from '../../hooks/useGlove';
import { ALEX_DICTIONARY } from '../../data/alexDictionary';
import { FRIZITTA_DICTIONARY } from '../../data/frizittaDictionary';

const { width } = Dimensions.get('window');

export default function CallScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id: contactId } = route.params || {};

  const uid = auth.currentUser?.uid || 'demo-user-deaf';
  const callId = `call_${uid}_${contactId}`;

  // Glove integrations
  const { currentSign, currentPhrase, confidence, isConnected, clearPhrase } = useGlove();

  // Firestore status and streams
  const [callData, setCallData] = useState(null);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [stopwatchTime, setStopwatchTime] = useState('00:00');
  const [wifiQuality, setWifiQuality] = useState(3); // 1, 2 or 3 bars

  // Settings & Toggles
  const [avatarStyle, setAvatarStyle] = useState('frezita'); // 'alex' or 'frezita'
  const [isMutedSign, setIsMutedSign] = useState(false);
  const [isSpeakerphone, setIsSpeakerphone] = useState(false);
  const [isHapticEnabled, setIsHapticEnabled] = useState(true);
  const [isQuickMsgOpen, setIsQuickMsgOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  // --- Avatar Display & Spelling Queues ---
  const [isAvatarPlaying, setIsAvatarPlaying] = useState(true);
  const [ignoredWords, setIgnoredWords] = useState([]);

  // Frizitta state
  const [frizittaQueue, setFrizittaQueue] = useState([]);
  const [frizittaIndex, setFrizittaIndex] = useState(-1);
  const [frizittaFrame, setFrizittaFrame] = useState({ char: 'NEUTRE', url: FRIZITTA_DICTIONARY.NEUTRE });

  // Alex double video buffers
  const [videoQueue, setVideoQueue] = useState([]);
  const [videoIndex, setVideoIndex] = useState(-1);
  const [activePlayer, setActivePlayer] = useState('A'); // 'A' or 'B'
  const [videoUriA, setVideoUriA] = useState(null);
  const [videoUriB, setVideoUriB] = useState(null);

  // Refs for tracking changes
  const lastFinalTextRef = useRef('');
  const timerStartedRef = useRef(false);
  const timerIntervalRef = useRef(null);
  const timerSecondsRef = useRef(0);
  const hasSwappedRef = useRef(false);

  const videoPlayerARef = useRef(null);
  const videoPlayerBRef = useRef(null);

  // Router bridge
  const router = {
    replace: (path) => {
      if (path.startsWith('/contacts/call-ended/')) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Contacts' } }, { name: 'CallEndedScreen', params: { id: contactId, callId } }],
        });
      }
    }
  };

  // 1. Initialize Firestore Call Session
  useEffect(() => {
    if (!contactId) return;

    const setupCall = async () => {
      try {
        await setDoc(doc(db, 'calls', callId), {
          status: 'active',
          callerId: uid,
          receiverId: contactId,
          timestamp: serverTimestamp(),
          hearingStream: {
            interim: '',
            final: '',
            isTyping: false
          },
          deafStream: {
            currentSign: '',
            confidence: 0,
            phrase: '',
            quickMessage: '',
            isActive: true
          }
        }, { merge: true });
        console.log('Call session successfully initialized in Firestore');
      } catch (e) {
        console.log('Error creating Firestore call document, running in local demo mode:', e);
      }
    };

    setupCall();
  }, [contactId]);

  // 2. Fetch User Avatar preference
  useEffect(() => {
    // Listen to user's profile to retrieve preferred avatarStyle
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.avatarStyle) setAvatarStyle(data.avatarStyle);
      }
    });
    return () => unsub();
  }, [uid]);

  // 3. Listen to Firestore Call Document updates
  useEffect(() => {
    if (!callId) return;

    const unsubCall = onSnapshot(doc(db, 'calls', callId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCallData(data);

        // Handle Hearing Speech stream
        if (data.hearingStream) {
          const hs = data.hearingStream;
          setInterimText(hs.interim || '');
          if (hs.final && hs.final !== lastFinalTextRef.current) {
            lastFinalTextRef.current = hs.final;
            playNewPhrase(hs.final);
          }
        }

        // Start Stopwatch once active
        if (data.status === 'active' && !timerStartedRef.current) {
          timerStartedRef.current = true;
          startStopwatch();
        }

        // If Hearing user ended call
        if (data.status === 'ended') {
          handleEndCallTransition();
        }
      }
    }, (err) => {
      console.log('Firestore listener error, loading simulated speech streams for demo:', err);
      // Simulate speech stream for high-fidelity demo
      simulateIncomingDemoSpeech();
    });

    return () => {
      unsubCall();
      stopStopwatch();
    };
  }, [callId, avatarStyle]);

  // Simulated speech for high fidelity demo if firebase fails
  const simulateIncomingDemoSpeech = () => {
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;
    startStopwatch();

    setTimeout(() => {
      setInterimText("Bonjour, comment");
    }, 4000);

    setTimeout(() => {
      setInterimText("");
      const text = "Always happy to help my friend";
      playNewPhrase(text);
    }, 8000);

    setTimeout(() => {
      setInterimText("est-ce que");
    }, 15000);

    setTimeout(() => {
      setInterimText("");
      const text = "Computer school beautiful";
      playNewPhrase(text);
    }, 20000);
  };

  // 4. Sync Glove Stream to Firestore
  useEffect(() => {
    if (!callId || !isConnected || isMutedSign) return;

    const syncGlove = async () => {
      try {
        await updateDoc(doc(db, 'calls', callId), {
          'deafStream.currentSign': currentSign || '',
          'deafStream.phrase': currentPhrase || '',
          'deafStream.confidence': confidence || 0,
          'deafStream.isActive': true
        });
      } catch (e) {
        // Silent catch for demo compatibility
      }
    };

    syncGlove();
  }, [currentSign, currentPhrase, confidence, isConnected, isMutedSign]);

  // 5. Simulated RTT / WiFi quality bars
  useEffect(() => {
    const int = setInterval(() => {
      // randomly toggle wifi bars between 2 and 3 for visual realism
      setWifiQuality(Math.random() > 0.85 ? 2 : 3);
    }, 5000);
    return () => clearInterval(int);
  }, []);

  // --- Stopwatch functions ---
  const startStopwatch = () => {
    stopStopwatch();
    timerSecondsRef.current = 0;
    timerIntervalRef.current = setInterval(() => {
      timerSecondsRef.current += 1;
      const mins = Math.floor(timerSecondsRef.current / 60).toString().padStart(2, '0');
      const secs = (timerSecondsRef.current % 60).toString().padStart(2, '0');
      setStopwatchTime(`${mins}:${secs}`);
    }, 1000);
  };

  const stopStopwatch = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Trigger vibration if enabled
  const triggerHaptic = () => {
    if (isHapticEnabled) {
      Vibration.vibrate(50);
    }
  };

  // --- Translation Processors ---
  const findAlexWord = (word) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!cleanWord) return null;

    // 1. Direct Original match
    let match = ALEX_DICTIONARY.find(item => item.original.toLowerCase() === cleanWord);
    if (match) return match;

    // 2. Synonyms match
    match = ALEX_DICTIONARY.find(item => item.synonymes && item.synonymes.some(syn => syn.toLowerCase() === cleanWord));
    if (match) return match;

    // 3. Hyphenated compound words
    const hyphenated = cleanWord.replace(/[\s_]+/g, '-');
    match = ALEX_DICTIONARY.find(item => item.original.toLowerCase() === hyphenated);
    if (match) return match;

    return null;
  };

  const processIncomingSpeech = (text) => {
    setFinalText(text);

    if (avatarStyle === 'alex') {
      // Alex ASL translation
      const words = text.split(/\s+/);
      const matchedItems = [];
      const newIgnored = [...ignoredWords];

      words.forEach(word => {
        const match = findAlexWord(word);
        if (match) {
          matchedItems.push(match);
        } else {
          const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanWord && !newIgnored.includes(cleanWord)) {
            newIgnored.push(cleanWord);
          }
        }
      });

      setIgnoredWords(newIgnored);

      if (matchedItems.length > 0) {
        setVideoQueue(prev => {
          const updated = [...prev, ...matchedItems];
          // If queue was idle, start playing
          if (prev.length === 0 || videoIndex >= prev.length) {
            setVideoIndex(prev.length);
            setupVideoPlayers(prev.length, updated);
          }
          return updated;
        });
      }
    } else {
      // Frizitta spelling translation
      const words = text.toUpperCase().split(/\s+/);
      const frames = [];

      words.forEach(word => {
        const clean = word.replace(/[^A-Z0-9]/g, '');
        for (let i = 0; i < clean.length; i++) {
          const char = clean[i];
          if (FRIZITTA_DICTIONARY[char]) {
            frames.push({ char, url: FRIZITTA_DICTIONARY[char], duration: 600 });
          }
        }
        frames.push({ char: 'NEUTRE', url: FRIZITTA_DICTIONARY.NEUTRE, duration: 300 });
      });

      if (frames.length > 0) {
        setFrizittaQueue(prev => {
          const updated = [...prev, ...frames];
          if (prev.length === 0 || frizittaIndex >= prev.length) {
            setFrizittaIndex(prev.length);
          }
          return updated;
        });
      }
    }
  };

  const playNewPhrase = async (text) => {
    if (!text || !text.trim()) return;

    // 1. Temporarily pause engine
    setIsAvatarPlaying(false);

    // Reset Frizitta queues
    setFrizittaQueue([]);
    setFrizittaIndex(-1);
    setFrizittaFrame({ char: 'NEUTRE', url: FRIZITTA_DICTIONARY.NEUTRE });

    // Reset Alex queues
    setVideoQueue([]);
    setVideoIndex(-1);
    setVideoUriA(null);
    setVideoUriB(null);
    setIgnoredWords([]);

    // Stop players asynchronously
    try {
      if (videoPlayerARef.current) {
        await videoPlayerARef.current.stopAsync();
      }
    } catch (e) {}
    try {
      if (videoPlayerBRef.current) {
        await videoPlayerBRef.current.stopAsync();
      }
    } catch (e) {}

    // Wait a brief moment to reset state cleanly, then play new text
    setTimeout(() => {
      setIsAvatarPlaying(true);
      processIncomingSpeech(text);
    }, 150);
  };

  // --- Frizitta Letter Loop ---
  useEffect(() => {
    if (avatarStyle !== 'frezita') return;
    if (!isAvatarPlaying || frizittaQueue.length === 0 || frizittaIndex < 0 || frizittaIndex >= frizittaQueue.length) {
      return;
    }

    const frame = frizittaQueue[frizittaIndex];
    setFrizittaFrame(frame);

    const timer = setTimeout(() => {
      setFrizittaIndex(prev => prev + 1);
    }, frame.duration);

    return () => clearTimeout(timer);
  }, [avatarStyle, isAvatarPlaying, frizittaQueue, frizittaIndex]);

  // --- Alex Double Buffer Engine ---
  const setupVideoPlayers = (index, queue) => {
    hasSwappedRef.current = false;
    const currentVid = queue[index];
    const nextVid = queue[index + 1];

    if (activePlayer === 'A') {
      setVideoUriA(currentVid.url);
      if (nextVid) setVideoUriB(nextVid.url);
    } else {
      setVideoUriB(currentVid.url);
      if (nextVid) setVideoUriA(nextVid.url);
    }
  };

  const handleVideoStatusUpdate = (status, player) => {
    if (!status.isLoaded || !isAvatarPlaying || player !== activePlayer) return;

    if (status.didJustFinish) {
      triggerBufferSwap();
      return;
    }

    if (status.durationMillis && status.positionMillis) {
      const remaining = status.durationMillis - status.positionMillis;
      if (remaining < 100 && !hasSwappedRef.current) {
        hasSwappedRef.current = true;
        triggerBufferSwap();
      }
    }
  };

  const triggerBufferSwap = async () => {
    const nextIndex = videoIndex + 1;

    if (nextIndex >= videoQueue.length) {
      // Queue finished
      setVideoIndex(nextIndex);
      return;
    }

    // Stop currently active player
    try {
      if (activePlayer === 'A' && videoPlayerARef.current) {
        await videoPlayerARef.current.stopAsync();
      } else if (activePlayer === 'B' && videoPlayerBRef.current) {
        await videoPlayerBRef.current.stopAsync();
      }
    } catch (e) {}

    // Swap players
    const nextActive = activePlayer === 'A' ? 'B' : 'A';
    setActivePlayer(nextActive);
    hasSwappedRef.current = false;
    setVideoIndex(nextIndex);

    // Play next video
    try {
      if (nextActive === 'A' && videoPlayerARef.current) {
        await videoPlayerARef.current.playAsync();
      } else if (nextActive === 'B' && videoPlayerBRef.current) {
        await videoPlayerBRef.current.playAsync();
      }
    } catch (e) {}

    // Preload next-next video in background player
    const nextNextVid = videoQueue[nextIndex + 1];
    if (nextNextVid) {
      if (nextActive === 'A') {
        setVideoUriB(nextNextVid.url);
      } else {
        setVideoUriA(nextNextVid.url);
      }
    }
  };

  // Play/Pause / Skip controllers
  const togglePlayPause = () => {
    triggerHaptic();
    setIsAvatarPlaying(!isAvatarPlaying);
  };

  const skipNextAvatarWord = () => {
    triggerHaptic();
    if (avatarStyle === 'alex') {
      if (videoIndex < videoQueue.length) {
        triggerBufferSwap();
      }
    } else {
      if (frizittaIndex < frizittaQueue.length) {
        setFrizittaIndex(prev => prev + 1);
      }
    }
  };

  // --- End Call Flow ---
  const handleEndCallPress = async () => {
    triggerHaptic();
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'ended'
      });
    } catch (e) {}
    handleEndCallTransition();
  };

  const handleEndCallTransition = () => {
    stopStopwatch();
    router.replace(`/contacts/call-ended/${contactId}`);
  };

  // Speak glove phrase out loud
  const handleSpeakPhrase = () => {
    triggerHaptic();
    if (!currentPhrase) return;
    Speech.speak(currentPhrase, {
      language: 'fr-FR'
    });
  };

  // Quick pre-written messages sending
  const handleSendQuickMessage = async (msg) => {
    triggerHaptic();
    setIsQuickMsgOpen(false);
    try {
      await updateDoc(doc(db, 'calls', callId), {
        'deafStream.quickMessage': msg
      });
      // Clear after 3 seconds so receiver knows it's temporary
      setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'calls', callId), {
            'deafStream.quickMessage': ''
          });
        } catch (e) {}
      }, 3000);
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. HORIZONTAL CALL HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarPlaceholderMini}>
            <Text style={styles.avatarMiniText}>
              {contactId ? contactId.slice(0, 2).toUpperCase() : 'SB'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {contactId?.includes('martin') ? 'Dr. Martin' : contactId?.includes('sara') ? 'Sara' : 'Contact'}
            </Text>
            <Text style={styles.stopwatchText}>{stopwatchTime}</Text>
          </View>
        </View>

        {/* WiFi strength visual representation */}
        <View style={styles.headerRight}>
          <View style={styles.wifiContainer}>
            <View style={[styles.wifiBar, { height: 6, backgroundColor: wifiQuality >= 1 ? '#00C853' : '#666666' }]} />
            <View style={[styles.wifiBar, { height: 10, backgroundColor: wifiQuality >= 2 ? '#00C853' : '#666666' }]} />
            <View style={[styles.wifiBar, { height: 14, backgroundColor: wifiQuality >= 3 ? '#00C853' : '#666666' }]} />
          </View>
          <Text style={styles.wifiText}>HD</Text>
        </View>
      </View>

      {/* 2. ZONE AVATAR LSF 3D */}
      <View style={styles.avatarOuterContainer}>
        <View style={styles.avatarInnerContainer}>
          {avatarStyle === 'frezita' ? (
            // Frizitta spell layout
            <Image
              source={{ uri: frizittaFrame.url }}
              style={styles.avatarFrameImage}
              fadeDuration={0}
            />
          ) : (
            // Alex ASL double video layout
            <View style={styles.videoOverlayWrapper}>
              <Video
                ref={videoPlayerARef}
                source={videoUriA ? { uri: videoUriA } : null}
                style={[styles.avatarVideo, { opacity: activePlayer === 'A' ? 1 : 0, zIndex: activePlayer === 'A' ? 2 : 1 }]}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isAvatarPlaying && activePlayer === 'A'}
                isMuted={true}
                onPlaybackStatusUpdate={(status) => handleVideoStatusUpdate(status, 'A')}
              />
              <Video
                ref={videoPlayerBRef}
                source={videoUriB ? { uri: videoUriB } : null}
                style={[styles.avatarVideo, { opacity: activePlayer === 'B' ? 1 : 0, zIndex: activePlayer === 'B' ? 2 : 1 }]}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isAvatarPlaying && activePlayer === 'B'}
                isMuted={true}
                onPlaybackStatusUpdate={(status) => handleVideoStatusUpdate(status, 'B')}
              />
              {/* Fallback image if video is idle/empty */}
              {videoIndex < 0 && (
                <View style={styles.avatarIdleBg}>
                  <Text style={styles.idleAvatarIcon}>🤙</Text>
                  <Text style={styles.idleAvatarText}>Interprète ALEX</Text>
                </View>
              )}
            </View>
          )}

          {/* Progress / Caption display */}
          <View style={styles.avatarCaptionBox}>
            <Text style={styles.avatarCaptionText}>
              {avatarStyle === 'frezita'
                ? frizittaFrame.char === 'NEUTRE' ? ' ' : frizittaFrame.char
                : videoIndex >= 0 && videoIndex < videoQueue.length ? videoQueue[videoIndex]?.original : 'En attente...'}
            </Text>
          </View>

          {/* Overlay controls */}
          <View style={styles.avatarControlsOverlay}>
            {/* Toggle Avatar Button */}
            <TouchableOpacity
              style={[styles.avatarMiniBtn, { width: 'auto', paddingHorizontal: 10 }]}
              onPress={() => {
                triggerHaptic();
                const newStyle = avatarStyle === 'frezita' ? 'alex' : 'frezita';
                setAvatarStyle(newStyle);
                // Stop any current reading/playback
                setIsAvatarPlaying(false);
                setFrizittaQueue([]);
                setFrizittaIndex(-1);
                setFrizittaFrame({ char: 'NEUTRE', url: FRIZITTA_DICTIONARY.NEUTRE });
                setVideoQueue([]);
                setVideoIndex(-1);
                setVideoUriA(null);
                setVideoUriB(null);
                setIgnoredWords([]);
              }}
            >
              <Ionicons name="people" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                {avatarStyle === 'frezita' ? '👉 Alex' : '👉 Frézita'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarMiniBtn} onPress={togglePlayPause}>
              <Ionicons name={isAvatarPlaying ? "pause" : "play"} size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarMiniBtn} onPress={skipNextAvatarWord}>
              <Ionicons name="play-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Ignored words text */}
      {avatarStyle === 'alex' && ignoredWords.length > 0 && (
        <Text style={styles.ignoredWordsText} numberOfLines={1}>
          Mots épelés/ignorés : {ignoredWords.join(', ')}
        </Text>
      )}

      {/* INPUT MANUEL POUR L'AVATAR */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>ÉCRIRE UNE PHRASE POUR L'AVATAR</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={avatarStyle === 'frezita' ? "Entrez du texte à épeler..." : "Entrez des mots à signer..."}
            placeholderTextColor="#666666"
            onSubmitEditing={() => {
              playNewPhrase(inputText);
              setInputText('');
            }}
          />
          <TouchableOpacity
            style={styles.translateBtn}
            onPress={() => {
              playNewPhrase(inputText);
              setInputText('');
            }}
          >
            <Ionicons name="send" size={14} color="#FFFFFF" />
            <Text style={styles.translateBtnText}>Jouer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. REAL-TIME TRANSCRIPT (HEARING USER SPEECH) */}
      <View style={styles.transcriptSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>PAROLE TRADUITE</Text>
          {interimText.length > 0 && (
            <ActivityIndicator size="small" color="#00C853" style={styles.typingIndicator} />
          )}
        </View>
        <ScrollView style={styles.transcriptCard} contentContainerStyle={styles.transcriptScroll}>
          <Text style={styles.speechText}>
            {finalText || interimText ? (
              <>
                <Text style={{ color: '#FFFFFF' }}>{finalText} </Text>
                <Text style={{ color: '#888888', fontStyle: 'italic' }}>{interimText}</Text>
              </>
            ) : (
              "En attente de la parole de votre interlocuteur..."
            )}
          </Text>
        </ScrollView>
      </View>

      {/* 4. REAL-TIME GLOVE STATUS & PHRASE ACCUMULATOR */}
      <View style={styles.gloveSection}>
        <View style={styles.gloveHeaderRow}>
          <View style={styles.gloveBadgeRow}>
            <View style={[styles.statusDotDot, { backgroundColor: isConnected ? '#00C853' : '#F44336' }]} />
            <Text style={[styles.gloveBadgeText, { color: isConnected ? '#00C853' : '#F44336' }]}>
              {isConnected ? 'GANTS CONNECTÉS' : 'GANTS DÉCONNECTÉS'}
            </Text>
          </View>
          {confidence > 0 && (
            <Text style={[styles.confidenceBadge, { color: confidence > 75 ? '#00C853' : '#FF9800' }]}>
              Fiabilité: {Math.round(confidence)}%
            </Text>
          )}
        </View>
        <View style={styles.gloveCard}>
          <Text style={styles.gloveLabel}>Signe détecté : <Text style={styles.gloveHighlight}>{currentSign && currentSign !== 'idle' ? currentSign.toUpperCase() : '...'}</Text></Text>
          <Text style={styles.gloveLabel}>Phrase construite :</Text>
          <Text style={styles.glovePhraseText}>
            {currentPhrase || 'Signez avec les gants pour construire votre message...'}
          </Text>
          <View style={styles.gloveActionRow}>
            <TouchableOpacity style={styles.gloveMiniBtn} onPress={clearPhrase} disabled={!currentPhrase}>
              <Ionicons name="trash-outline" size={18} color={currentPhrase ? "#FFFFFF" : "#666666"} />
              <Text style={[styles.gloveMiniBtnText, { color: currentPhrase ? "#FFFFFF" : "#666666" }]}>Vider</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gloveSpeakBtn} onPress={handleSpeakPhrase} disabled={!currentPhrase}>
              <Ionicons name="volume-high" size={18} color="#FFFFFF" />
              <Text style={styles.gloveSpeakBtnText}>Lire à voix haute</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 5. BOTTOM CALL CONTROLS */}
      <View style={styles.bottomControls}>
        <View style={styles.controlsRow}>
          {/* Mute glove signs */}
          <TouchableOpacity
            style={[styles.circleControlBtn, isMutedSign && styles.circleControlBtnActive]}
            onPress={() => { triggerHaptic(); setIsMutedSign(!isMutedSign); }}
          >
            <Ionicons name={isMutedSign ? "eye-off" : "eye"} size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Speakerphone */}
          <TouchableOpacity
            style={[styles.circleControlBtn, isSpeakerphone && styles.circleControlBtnActive]}
            onPress={() => { triggerHaptic(); setIsSpeakerphone(!isSpeakerphone); }}
          >
            <Ionicons name={isSpeakerphone ? "volume-high" : "volume-medium"} size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* End Call (Red) */}
          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCallPress}>
            <Ionicons name="call" size={26} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          {/* Haptic feedback toggler */}
          <TouchableOpacity
            style={[styles.circleControlBtn, isHapticEnabled && styles.circleControlBtnActive]}
            onPress={() => { setIsHapticEnabled(!isHapticEnabled); Vibration.vibrate(50); }}
          >
            <Ionicons name="hand-right" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Quick Message keyboard overlay trigger */}
          <TouchableOpacity
            style={[styles.circleControlBtn, isQuickMsgOpen && styles.circleControlBtnActive]}
            onPress={() => { triggerHaptic(); setIsQuickMsgOpen(!isQuickMsgOpen); }}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick message popup overlay drawer */}
      {isQuickMsgOpen && (
        <View style={styles.quickMsgOverlay}>
          <Text style={styles.quickMsgTitle}>MESSAGES RAPIDES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickMsgChips}>
            {[
              "Un instant s'il vous plaît",
              "Pouvez-vous répéter ?",
              "Oui",
              "Non",
              "Merci beaucoup",
              "Je ne comprends pas",
            ].map((msg, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickMsgChip}
                onPress={() => handleSendQuickMessage(msg)}
              >
                <Text style={styles.quickMsgChipText}>{msg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  // Call Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholderMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  stopwatchText: {
    color: '#00C853',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wifiContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  wifiBar: {
    width: 3.5,
    borderRadius: 1.5,
  },
  wifiText: {
    color: '#00C853',
    fontSize: 11,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#00C853',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  // 3D LSF Avatar Container
  avatarOuterContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#0a0a0a',
    padding: 12,
    maxHeight: 280, // Cap to keep layout balanced
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerContainer: {
    width: '90%',
    height: '95%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFrameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  videoOverlayWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  avatarVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  avatarIdleBg: {
    flex: 1,
    backgroundColor: '#1E253D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleAvatarIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  idleAvatarText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarCaptionBox: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  avatarCaptionText: {
    color: '#00C853',
    fontWeight: 'bold',
    fontSize: 13,
  },
  avatarControlsOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  avatarMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ignoredWordsText: {
    color: '#666666',
    fontSize: 11,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  // Real-time speech transcript
  transcriptSection: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.1,
  },
  typingIndicator: {
    marginRight: 4,
  },
  transcriptCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    flex: 1,
  },
  transcriptScroll: {
    padding: 12,
  },
  speechText: {
    fontSize: 15,
    lineHeight: 22,
  },
  // Glove visual card
  gloveSection: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  gloveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gloveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  gloveBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  confidenceBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  gloveCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 12,
  },
  gloveLabel: {
    color: '#9E9E9E',
    fontSize: 12,
    marginBottom: 4,
  },
  gloveHighlight: {
    color: '#00C853',
    fontWeight: 'bold',
    fontSize: 14,
  },
  glovePhraseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    backgroundColor: 'rgba(0,200,83,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,83,0.15)',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  gloveActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  gloveMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  gloveMiniBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gloveSpeakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C853',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  gloveSpeakBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Bottom Controls
  bottomControls: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  circleControlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleControlBtnActive: {
    backgroundColor: '#00C853',
  },
  endCallBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  // Quick message drawer styles
  quickMsgOverlay: {
    position: 'absolute',
    bottom: 92,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    zIndex: 100,
  },
  quickMsgTitle: {
    color: '#9E9E9E',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  quickMsgChips: {
    gap: 8,
    paddingBottom: 4,
  },
  quickMsgChip: {
    backgroundColor: '#2A2A2A',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  quickMsgChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  // Manual text input styles
  inputSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    padding: 4,
    alignItems: 'center',
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 12,
    height: 40,
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C853',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  translateBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
