import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from 'expo-status-bar';
import { View } from "react-native";
import { initializeNotifications } from "../src/notifications/useNotification";
import '../assets/global.css';

 function RootLayout() {
  useEffect(() => {
    initializeNotifications();
  }, []);
  
  return (
    <View className="flex-1 bg-secondary">
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </View>
  );
}
export default RootLayout;