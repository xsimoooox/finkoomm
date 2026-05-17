import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export function useWebSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState(null);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;

        recog.onresult = (event) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }

          if (currentFinal) {
            setFinalText((prev) => prev + currentFinal + ' ');
          }
          setInterimText(currentInterim);
        };

        recog.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setError(event.error);
          setIsListening(false);
        };

        recog.onend = () => {
          // Si on écoute toujours, on le relance (auto-reconnect)
          // La gestion de la boucle de reconnexion se fait dans start/stop ou via useEffect
          // Pour éviter les boucles infinies sur erreur, on utilise un state géré au-dessus
        };

        setRecognition(recog);
      } else {
        setError('SpeechRecognition non supporté sur ce navigateur.');
      }
    }
  }, []);

  const startListening = useCallback((lang = 'fr-FR') => {
    if (recognition) {
      try {
        recognition.lang = lang;
        recognition.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error("Erreur au démarrage", err);
      }
    } else {
      setError('Non supporté sur cette plateforme.');
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop();
        setIsListening(false);
      } catch (err) {
        console.error("Erreur à l'arrêt", err);
      }
    }
  }, [recognition]);

  const resetText = useCallback(() => {
    setInterimText('');
    setFinalText('');
  }, []);

  return {
    isListening,
    interimText,
    finalText,
    error,
    startListening,
    stopListening,
    resetText,
    supported: !!recognition || Platform.OS !== 'web'
  };
}
