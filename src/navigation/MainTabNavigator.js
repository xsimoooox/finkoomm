import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ContactsScreen from '../screens/ContactsScreen';
import RencontreScreen from '../screens/RencontreScreen';
import UrgenceScreen from '../screens/UrgenceScreen';
import HistoriqueScreen from '../screens/HistoriqueScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CallNotificationBanner from '../components/CallNotificationBanner';
import { useNotifications } from '../hooks/useNotifications';

const Tab = createBottomTabNavigator();

// Mock store counts for badges
const store = {
  unreadMessages: 2,
  sosActive: true, // example pulse
  newHistory: true,
};

function TabIcon({ name, color, focused, isUrgence }) {
  // Urgence is ALWAYS red. Active is #22c55e. Inactive is #6b7280.
  const iconColor = isUrgence ? '#ef4444' : (focused ? '#22c55e' : '#6b7280');
  
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Ionicons name={name} size={24} color={iconColor} />
    </View>
  );
}

function TabBadge({ visible, count, isPulse }) {
  if (!visible) return null;
  return (
    <View style={[styles.badge, isPulse && styles.badgePulse]}>
      {count ? <Text style={styles.badgeText}>{count}</Text> : null}
    </View>
  );
}

export default function MainTabNavigator() {
  const { incomingCall, clearNotification } = useNotifications('current-user-123');

  return (
    <View style={{ flex: 1 }}>
      <CallNotificationBanner 
        incomingCall={incomingCall} 
        onDismiss={clearNotification} 
      />
      <Tab.Navigator
        initialRouteName="Accueil"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#6b7280',
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} />
              <TabBadge visible={store.unreadMessages > 0} count={store.unreadMessages} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Rencontre"
        component={RencontreScreen}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'qr-code' : 'qr-code-outline'} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Urgence"
        component={UrgenceScreen}
        options={{
          tabBarLabelStyle: [styles.tabLabel, { color: '#ef4444' }],
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} isUrgence />
              <TabBadge visible={store.sosActive} isPulse />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Historique"
        component={HistoriqueScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} />
              <TabBadge visible={store.newHistory} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Paramètres"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} />,
        }}
      />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a0a0a',
    borderTopColor: '#1f2937',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0a0a0a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgePulse: {
    // Note: To pulse this properly we'd use Animated or Reanimated, but keeping it simple visually for now.
    borderWidth: 0,
    width: 12,
    height: 12,
    right: -4,
    top: -2,
  }
});
