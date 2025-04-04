import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from 'expo-status-bar';
import { View } from "react-native";
import { initializeNotifications } from "../src/notifications/useNotification";
import '../assets/global.css';
import * as Notifications from 'expo-notifications';
import { router } from "expo-router";
import { MenuProvider } from 'react-native-popup-menu';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootLayout() {
  useEffect(() => {
    // Initialize notifications
    initializeNotifications();
    
    // Handle notification clicks
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data?.contactId && data?.screen === 'oneOnOne') {
        router.push({
          pathname: '/chat/oneOnOne',
          params: { contactId: data.contactId }
        });
      } else if (data?.channel) {
        router.push({
          pathname: "/chat/[token]",
          params: { token: data.channel }
        });
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
        <View className="flex-1 bg-secondary">
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          />
        </View>
      </MenuProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;