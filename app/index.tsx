import { KeyboardAvoidingView, ScrollView, Platform, Text, View, TextInput, TouchableOpacity, Pressable, Alert, Animated, ImageBackground, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { checkForUpdates } from "@/src/utils/updateNotifier";
// Main login screen component
export default function Index() {
  const router = useRouter();
  // State management for form inputs and UI
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Initial setup and animations

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

  // Load saved credentials if remember me is toggled
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

  // Check if user is already logged in
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

  // Handle login form submission
  const handleLogin = async () => {
    try {
      setError('');
      setIsLoggingIn(true);
      const response = await fetch(`${API_BASE_URL}/api/userLogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userSession', JSON.stringify(data));
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedCredentials', JSON.stringify({ username, password }));
        } else {
          await AsyncStorage.removeItem('rememberedCredentials');
        }
        router.replace('/home');
        console.log('Login successful:', data);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show loading state
  if (loading) {
    return null;
  }

  // Main UI render
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <ImageBackground source={require('../assets/background/bg-3.jpg')} className="flex-1">
          <View className="flex-1 p-8">
            {/* Logo and title section */}
            <Animated.View className="flex-1 justify-center" style={{ opacity: fadeAnim }}>
              <Animated.View className="items-center mb-10" style={{ transform: [{ scale: scaleAnim }] }}>
                <View className="bg-white p-5 rounded-full mb-6 shadow-lg">
                  <Ionicons name="chatbubbles" size={50} color="#f47a04" />
                </View>
                <Text className="text-5xl font-black text-[#047835] drop-shadow-xl mb-1 rounded-full"
                  style={{
                    textShadowColor: '#FFFFFF',
                    textShadowOffset: { width: 2, height: 1 },
                    textShadowRadius: 2, shadowColor: '#9E6B2E',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 0.5, shadowRadius: 3
                  }}
                >LS Chat</Text>
                <Text className="text-lg text-orange-500">Lemon Square Chat App</Text>
              </Animated.View>

              {/* Login form section */}
              <Animated.View className="space-y-6" style={{ transform: [{ translateY: slideAnim }] }}>
                {/* Error message display */}
                {error ? (
                  <View className="bg-red-100/90 p-4 rounded-xl flex-row items-center mb-4">
                    <Ionicons name="alert-circle" size={24} color="#ef4444" />
                    <Text className="text-red-600 ml-3 flex-1">{error}</Text>
                  </View>
                ) : null}

                {/* Username and password inputs */}
                <View className="bg-orange-100/60 backdrop-blur-lg rounded-2xl overflow-hidden">
                  <View className="flex-row items-center px-5 border-b border-gray-200">
                    <Ionicons name="person" size={24} color="#047835" />
                    <TextInput
                      className="flex-1 py-5 px-4 text-gray-800 text-lg"
                      placeholder="Username"
                      placeholderTextColor="rgba(0,0,0,0.5)"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      editable={!isLoggingIn}
                    />
                  </View>
                  <View className="flex-row items-center px-5">
                    <Ionicons name="lock-closed" size={24} color="#047835" />
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

                {/* Remember me and forgot password section */}
                <View className="flex-row justify-between items-center px-2 py-3">
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => setRememberMe(!rememberMe)}
                    disabled={isLoggingIn}
                  >
                    <View className="bg-blue-100/60 rounded-md p-1">
                      <Ionicons
                        name={rememberMe ? "checkbox" : "square-outline"}
                        size={20}
                        color="#047835"
                      />
                    </View>
                    <Text className="text-black ml-3 text-sm">Remember Me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push('/forgot-password')}
                    activeOpacity={0.7}
                    disabled={isLoggingIn}
                  >
                    <Text className="text-[#047835] text-sm">Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Login button */}
                <View className="flex-row justify-center items-center mt-4">
                <TouchableOpacity
                  className="bg-orange-400 mt-6 h-14 rounded-xl justify-center items-center shadow-lg w-3/5 top-2"
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

            {/* Sign up link section */}
            <Animated.View
              className="flex-row justify-center items-center py-8"
              style={{ opacity: fadeAnim }}
            >
              <Text className="text-white/90 text-base">Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.7} disabled={isLoggingIn}>
                <Text className="text-white font-extrabold text-base">Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>
            {/* Footer */}
            <View className="items-center pb-3">
              <Text className="text-white/70 text-sm">Powered by ICTD</Text>
            </View>
          </View>
        </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}