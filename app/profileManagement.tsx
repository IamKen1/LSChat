import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config';
// Main profile management component
const ProfileManagement = () => {833
      const navigation = useNavigation();
      // State variables for user data
      const [userId, setUserId] = useState<number | null>(null);
      const [firstName, setFirstName] = useState('');
      const [middleName, setMiddleName] = useState('');
      const [lastName, setLastName] = useState('');
      const [username, setUsername] = useState('');
      const [password, setPassword] = useState('');
      const [email, setEmail] = useState('');
      const [mobileNumber, setMobileNumber] = useState('');
      const [isLoading, setIsLoading] = useState(false);
  
      // Load user data on component mount
      useEffect(() => {
        fetchUserData();
      }, []);

      // Fetch user data from AsyncStorage
      const fetchUserData = async () => {
        try {
          const userSessionData = await AsyncStorage.getItem('userSession');
          if (userSessionData) {
            const userData = JSON.parse(userSessionData);
            setUserId(userData.user.user_id);
            setFirstName(userData.user.first_name || '');
            setMiddleName(userData.user.middle_name || '');
            setLastName(userData.user.last_name || '');
            setUsername(userData.user.username || '');
            setEmail(userData.user.email || '');
            setMobileNumber(userData.user.mobile_number || '');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Error', 'Failed to load user data');
        }
      };

      // Validate required input fields
      const validateInputs = () => {
        if (!firstName.trim() || !lastName.trim() || !username.trim() || !mobileNumber.trim()) {
          Alert.alert('Error', 'Please fill in all required fields');
          return false;
        }
        return true;
      };

      // Handle profile update submission
      const handleUpdateProfile = async () => {
        if (!validateInputs()) return;
        
        setIsLoading(true);
        try {
          // Get current user data from storage
          const userSessionData = await AsyncStorage.getItem('userSession');
          const currentUserData = userSessionData ? JSON.parse(userSessionData).user : {};
          
          // Prepare updated user data
          const updatedUserData = {
            first_name: firstName.trim(),
            middle_name: middleName.trim(),
            last_name: lastName.trim(),
            username: username.trim(),
            password: password.trim() || currentUserData.password,
            email: email.trim().toLowerCase(),
            mobile_number: mobileNumber.trim(),
          };

          // Send update request to API
          const response = await fetch(`${API_BASE_URL}/api/updateRecord/${userId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(updatedUserData),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Failed to update profile');
          }

          // Update local storage with new data
          await AsyncStorage.setItem('userSession', JSON.stringify({ 
            user: { ...updatedUserData, user_id: userId } 
          }));

          Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
          console.error('Error updating profile:', error);
          Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile');
        } finally {
          setIsLoading(false);
        }
      };

      // Render profile management form
      return (
        <SafeAreaView className="flex-1 bg-white">
          <ScrollView className="flex-1">
            {/* Header section */}
             <LinearGradient colors={['#6B21A8', '#3B0764']} className="p-4 shadow-lg">
              <Text className="text-white text-2xl font-bold text-center">Profile Management</Text>
            </LinearGradient>
            {/* Form inputs */}
            <View className="p-5">
              {/* First Name input */}
              <Text className="text-sm font-semibold text-gray-700 mb-1">First Name *</Text>
              <TextInput
                className="h-11 bg-white border border-gray-200 mb-4 p-3 rounded-lg text-base text-gray-800"
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#666"
                maxLength={50}
              />
              {/* Middle Name input */}
              <Text className="text-sm font-semibold text-gray-700 mb-1">Middle Name</Text>
              <TextInput
                className="h-11 bg-white border border-gray-200 mb-4 p-3 rounded-lg text-base text-gray-800"
                placeholder="Enter your middle name"
                value={middleName}
                onChangeText={setMiddleName}
                placeholderTextColor="#666"
                maxLength={50}
              />
              {/* Last Name input */}
              <Text className="text-sm font-semibold text-gray-700 mb-1">Last Name *</Text>
              <TextInput
                className="h-11 bg-white border border-gray-200 mb-4 p-3 rounded-lg text-base text-gray-800"
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#666"
                maxLength={50}
              />
              {/* Username input */}
              <Text className="text-sm font-semibold text-gray-700 mb-1">Username *</Text>
              <TextInput
                className="h-11 bg-white border border-gray-200 mb-4 p-3 rounded-lg text-base text-gray-800"
                placeholder="Choose a username"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#666"
                maxLength={30}
                autoCapitalize="none"
              />
              {/* Password input */}
              <Text className="text-sm font-semibold text-gray-700 mb-1">Password</Text>
              <TextInput
                className="h-11 bg-white border border-gray-200 mb-4 p-3 rounded-lg text-base text-gray-800"
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#666"
                maxLength={30}
              />
              {/* Email input */}
              <Text className="text-sm font-semibold text-gray-700 mb-1">Email</Text>
              <TextInput
                className="h-11 bg-white border border-gray-200 mb-4 p-3 rounded-lg text-base text-gray-800"
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor="#666"
                autoCapitalize="none"
                maxLength={100}
              />
              {/* Mobile Number input */}
              <Text className="text-sm font-semibold text-gray-700 mb-1">Mobile Number *</Text>
              <TextInput
                className="h-11 bg-white border border-gray-200 mb-4 p-3 rounded-lg text-base text-gray-800"
                placeholder="Enter your mobile number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#666"
                maxLength={15}
              />
              {/* Update button */}
              <TouchableOpacity 
                className={`p-4 rounded-lg items-center mt-2.5 ${isLoading ? 'bg-gray-400' : 'bg-[#6B21A8]'}`}
                onPress={handleUpdateProfile}
                disabled={isLoading}
              >
                <Text className="text-white text-base font-semibold">{isLoading ? 'Updating...' : 'Update Profile'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
}

export default ProfileManagement