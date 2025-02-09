import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import '../assets/global.css';
import { View } from "react-native";

export default function RootLayout() {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar style="dark" />
        <Stack 
          screenOptions={{
            headerShown: false,
            animation: 'fade',          }}
          initialRouteName="index"
          screenListeners={{
            beforeRemove: () => {
              // Cleanup resources before removing screen
            },
          }}
        />
      </View>
    );
}