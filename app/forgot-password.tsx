import { Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [timer, setTimer] = useState(30);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          newPassword 
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Password updated successfully', [
          {
            text: 'OK',
            onPress: () => router.replace('/')
          }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update password');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const sendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setIsOtpSent(true);
        startTimer();
        Alert.alert('Success', 'OTP has been sent to your email');
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  const verifyOTP = async () => {
    if (attempts <= 0) {
      Alert.alert('Account Locked', 'Please contact support to unlock your account');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (response.ok) {
        setOtpVerified(true);
        setOtpSent(false);
        Alert.alert('Success', 'OTP verified successfully. Please set your new password.');
      } else {
        setAttempts(prev => prev - 1);
        Alert.alert('Error', `Invalid OTP. ${attempts - 1} attempts remaining`);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };
  return (
    <View className="flex-1 p-8 bg-white">
      <TouchableOpacity 
        onPress={() => router.back()}
        className="mb-6"
      >
        <Ionicons name="arrow-back" size={24} color="#047835" />
      </TouchableOpacity>

      <Text className="text-2xl font-bold mb-6">Reset Password</Text>

      {!otpSent && !otpVerified ? (
        <View>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            className="bg-orange-400 p-4 rounded-lg items-center"
            onPress={sendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : otpSent && !otpVerified ? (
        <View>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Text className="text-gray-500 mb-4">Time remaining: {timer}s</Text>
          {timer === 0 && (
            <TouchableOpacity
              className="mb-4"
              onPress={sendOTP}
            >
              <Text className="text-orange-400">Resend OTP</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="bg-orange-400 p-4 rounded-lg items-center"
            onPress={verifyOTP}
          >
            <Text className="text-white font-bold">Verify OTP</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            className="border border-gray-300 rounded-lg p-4 mb-4"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <TouchableOpacity
            className="bg-orange-400 p-4 rounded-lg items-center"
            onPress={updatePassword}
          >
            <Text className="text-white font-bold">Update Password</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}