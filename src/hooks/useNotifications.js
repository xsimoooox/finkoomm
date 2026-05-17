import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { rtdb } from '../config/firebase';
import { ref, onValue, remove, set, push } from 'firebase/database';
// import { getMessaging, getToken, onMessage } from 'firebase/messaging'; 
// FCM Web / Native push setup usually requires extra config

export function useNotifications(userId) {
  const [incomingCall, setIncomingCall] = useState(null);

  // Écoute des notifications dans RTDB (pour online & pending hors-ligne)
  useEffect(() => {
    if (!userId) return;

    const notifRef = ref(rtdb, `notifications/${userId}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Prendre la première notification d'appel
        const notifId = Object.keys(data)[0];
        const notif = data[notifId];

        if (notif && notif.type === 'call' && notif.status === 'pending') {
          // Vérifier si l'appel est toujours actif (durée < 30s ou autre règle)
          const now = Date.now();
          if (now - notif.timestamp < 60000) { // 1 min max pour la validité de la notif
            setIncomingCall({ ...notif, id: notifId });
            // Jouer un son d'alerte ici si possible
          } else {
            // Notification expirée
            remove(ref(rtdb, `notifications/${userId}/${notifId}`));
          }
        }
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const clearNotification = (notifId) => {
    if (userId && notifId) {
      remove(ref(rtdb, `notifications/${userId}/${notifId}`));
      setIncomingCall(null);
    }
  };

  const sendCallNotification = async (targetUserId, callCode) => {
    // 1. Sauvegarder dans RTDB pour gestion in-app & offline
    const notifRef = ref(rtdb, `notifications/${targetUserId}`);
    const newNotifRef = push(notifRef);
    await set(newNotifRef, {
      type: 'call',
      code: callCode,
      status: 'pending',
      timestamp: Date.now(),
      message: `📞 Appel entrant — Code : ${callCode} — Appuyez sur Rejoindre`
    });

    // 2. TODO: Envoyer une requête à une Cloud Function ou utiliser FCM API 
    // pour déclencher une Push Notification Web/Mobile (Firebase Cloud Messaging).
  };

  return {
    incomingCall,
    clearNotification,
    sendCallNotification
  };
}
