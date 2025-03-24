import { KeyboardAvoidingView,ScrollView, Platform, Text, View, TextInput, TouchableOpacity, Pressable, Alert, Animated, ImageBackground, Image, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import  { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { checkForUpdates } from "@/src/utils/updateNotifier";
import { getMessaging, getToken as getMessagingToken } from '@react-native-firebase/messaging';




export default function Index() {
  const router = useRouter();


  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);



  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;




  useEffect(() => {
    if (checkForUpdates) {
      checkForUpdates();
    }
  }, []);

  useEffect(() => {
    console.log(API_BASE_URL);
    checkSession();
    checkRememberedCredentials();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);



  const checkRememberedCredentials = async () => {
    try {
      const savedCredentials = await AsyncStorage.getItem('rememberedCredentials');
      if (savedCredentials) {
        const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
        setUsername(savedUsername);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading remembered credentials:', error);
    }
  };



  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem('userSession');
      if (session) {
        router.replace('/home');
      }
      setLoading(false);
    } catch (error) {
      console.log('Error checking session:', error);
      setLoading(false);
    }
  };



  const handleLogin = async () => {
    try {
      setError('');
      setIsLoggingIn(true);

      // Retrieve FCM token
      const messaging = getMessaging();
      const fcm_token = await getMessagingToken(messaging);

      const response = await fetch(`${API_BASE_URL}/api/userLogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password, 
          fcm_token 
        }),
      });

      const data = await response.json();
      console.log('data ng json:', data);
      if (data.success) {
        console.log('Login successful:', data);
        await AsyncStorage.setItem('userSession', JSON.stringify(data));
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedCredentials', JSON.stringify({ username, password }));
        } else {
          await AsyncStorage.removeItem('rememberedCredentials');
        }
        router.replace('/home');
        console.log('Login successful:', data);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (error) {
      setError('Network error. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };



  if (loading) {
    return null;
  }



  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-white">
          <ImageBackground source={require('../assets/background/bg-7.jpg')} className="flex-1">
            <View className="flex-1 p-8">
              <Animated.View className="flex-1 justify-center mt-16" style={{ opacity: fadeAnim }}>
                <Animated.View className="items-center mb-3" style={{ transform: [{ scale: scaleAnim }] }}>
                  <View className="w-56 h-56 rounded-xl overflow-hidden">
                    <Image
                      source={require('../assets/logo/ls_chat4.png')}
                      className="w-full h-full"
                      resizeMode="contain"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84
                      }}
                    />
                  </View>
                </Animated.View>
                <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
                  {error ? (
                    <View className="bg-red-100/90 p-4 rounded-xl flex-row items-center  mb-4">
                      <Ionicons name="alert-circle" size={24} color="#ef4444" />
                      <Text className="text-red-600 ml-3 flex-1">{error}</Text>
                    </View>
                  ) : null}

                  <View className="bg-white rounded-2xl overflow-hidden">
                    <View className="flex-row items-center px-5 border-b border-gray-200">
                      <Ionicons name="person" size={24} color="#047835" style={{ textShadowColor: 'rgba(4, 120, 53, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }} />
                      <TextInput
                        className="flex-1 py-5 px-4 text-black text-lg"
                        placeholder="Username"
                        placeholderTextColor="rgba(0,0,0,0.5)"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        editable={!isLoggingIn}
                      />
                    </View>

                    <View className="flex-row items-center px-5">
                      <Ionicons name="lock-closed" size={24} color="#047835" style={{ textShadowColor: 'rgba(4, 120, 53, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 1 }} />
                      <TextInput
                        className="flex-1 py-5 px-4 text-gray-800 text-lg"
                        placeholder="Password"
                        placeholderTextColor="rgba(0,0,0,0.5)"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoggingIn}
                      />
                      <Pressable
                        onPressIn={() => setShowPassword(true)}
                        onPressOut={() => setShowPassword(false)}
                        className="p-2"
                        disabled={isLoggingIn}
                      >
                        <Ionicons
                          name={showPassword ? "eye" : "eye-off"}
                          size={24}
                          color="#047835"
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center px-2 py-3">
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => setRememberMe(!rememberMe)}
                      disabled={isLoggingIn}
                    >
                      <View className="bg-blue-100/60 rounded-lg p-1">
                        <Ionicons
                          name={rememberMe ? "checkbox" : "square-outline"}
                          size={20}
                          color="#047835"
                        />
                      </View>

                      <Text className="text-white ml-3 text-sm">Remember Me</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => router.push('/forgot-password')}
                      className="active:opacity-70"
                      disabled={isLoggingIn}
                    >
                      <Text className="text-white text-sm">Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-center items-center mt-4">
                    <TouchableOpacity
                      className="bg-orange-400 mt-6 h-14 rounded-xl justify-center items-center shadow-md w-3/5 top-2"
                      onPress={handleLogin}
                      activeOpacity={0.7}
                      disabled={isLoggingIn}
                    >
                      {isLoggingIn ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white text-lg font-bold">Login</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </Animated.View>

              <Animated.View
                className="flex-row justify-center items-center py-8"
                style={{ opacity: fadeAnim }}
              >
                <Text className="text-white/90 text-base">Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/signup')} className="active:opacity-70" disabled={isLoggingIn}>
                  <Text className="text-white font-extrabold text-base">Sign Up</Text>
                </TouchableOpacity>
              </Animated.View>

              <View className="items-center pb-3">
                <Text className="text-white/70 text-sm">Powered by ICTD</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
