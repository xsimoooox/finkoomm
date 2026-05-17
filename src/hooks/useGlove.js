import { useState, useEffect, useRef } from 'react';

const WEBSOCKET_URL = 'ws://192.168.1.100:5000/glove'; // Replace with actual Flask IP

export function useGlove() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentSign, setCurrentSign] = useState(null);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [confidence, setConfidence] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const debounceRef = useRef(null);
  const lastSignRef = useRef(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WEBSOCKET_URL);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Glove WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.sign) {
            // Debounce and anti-duplicate logic
            if (debounceRef.current) clearTimeout(debounceRef.current);
            
            debounceRef.current = setTimeout(() => {
              if (data.sign !== lastSignRef.current) {
                lastSignRef.current = data.sign;
                setCurrentSign(data.sign);
                setConfidence(data.confidence || 0);
                
                // Append to phrase if it's a new word/letter
                if (data.sign !== 'space' && data.sign !== 'idle') {
                  setCurrentPhrase((prev) => (prev ? prev + ' ' + data.sign : data.sign));
                }
              }
            }, 500);
          }
        } catch (e) {
          console.error('Error parsing glove data', e);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Glove WebSocket closed, reconnecting in 3s...');
        // Auto-reconnect every 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (e) => {
        console.error('Glove WebSocket error', e);
        wsRef.current?.close();
      };
    } catch (e) {
      console.error('Failed to create WebSocket', e);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearPhrase = () => {
    setCurrentPhrase('');
    setCurrentSign(null);
    setConfidence(0);
    lastSignRef.current = null;
  };

  return {
    isConnected,
    currentSign,
    currentPhrase,
    confidence,
    clearPhrase,
  };
}
