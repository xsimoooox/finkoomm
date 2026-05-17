import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';

export default function CallNotificationBanner({ incomingCall, onDismiss }) {
  const navigation = useNavigation();
  const [slideAnim] = useState(new Animated.Value(-100)); // Off-screen initially

  useEffect(() => {
    let soundObj;
    let timer;

    async function playAlert() {
      try {
        // We'd ideally load a local sound file, but for now we create a mock beep
        // const { sound } = await Audio.Sound.createAsync(require('../../assets/alert.mp3'));
        // soundObj = sound;
        // await soundObj.playAsync();
      } catch (error) {
        console.log("Audio play error", error);
      }
    }

    if (incomingCall) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      playAlert();

      // Disappear after 30 seconds
      timer = setTimeout(() => {
        dismiss();
      }, 30000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (soundObj) {
        soundObj.unloadAsync();
      }
    };
  }, [incomingCall]);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss(incomingCall?.id);
    });
  };

  const handleJoin = () => {
    // Navigate to Contacts Tab -> CallText with the code
    navigation.navigate('Contacts', { screen: 'CallText', params: { autoJoinCode: incomingCall.code } });
    dismiss();
  };

  if (!incomingCall) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <Ionicons name="call" size={24} color="#fff" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Appel Entrant</Text>
          <Text style={styles.message}>Code : {incomingCall.code}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
            <Text style={styles.joinBtnText}>Rejoindre</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={dismiss}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Safe area approx
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  banner: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  iconContainer: {
    backgroundColor: '#22c55e',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dismissBtn: {
    padding: 4,
  }
});
