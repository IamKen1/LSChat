import { Text, View, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import Checkbox from 'expo-checkbox';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config';
export default function SignUp() {
  // Initialize router for navigation
  const router = useRouter();
  // State for terms and conditions checkbox
  const [isChecked, setChecked] = useState(false);
  // State for privacy policy modal
  const [showModal, setShowModal] = useState(false);
  // User input states
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  // Loading state for API calls
  const [loading, setLoading] = useState(false);

  // Validate all user input fields
  const validateInputs = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    if (username.length < 4) {
      Alert.alert('Error', 'Username must be at least 4 characters long');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Password is required');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return false;
      }
    }
    if (!mobileNumber.trim()) {
      Alert.alert('Error', 'Mobile number is required');
      return false;
    }
    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 11-digit mobile number');
      return false;
    }
    return true;
  };

  // Handle user registration
  const handleSignUp = async () => {
    // Check if terms are accepted
    if (!isChecked) {
      Alert.alert(
        'Terms & Conditions Required',
        'Please agree to the terms and conditions to continue.',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
      return;
    }

    // Validate user inputs
    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    // Prepare user data for API
    const userData = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      username: username,
      password: password,
      email: email,
      mobile_number: mobileNumber,
    };

    try {
      // Send registration request to API
      const response = await fetch(`${API_BASE_URL}/api/createRecord`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      // Handle successful registration
      if (response.ok && data.message === "Record created successfully") {
        Alert.alert(
          '✨ Success!',
          'Your account has been created successfully. Welcome to MOSH!',
          [{ text: 'Continue', style: 'default', onPress: () => router.replace('/') }],
          { cancelable: false }
        );
      } else {
        // Handle various error responses
        let errorMessage = '';
        let errorTitle = '';

        if (data.sqlError && data.sqlError.includes('UNIQUE KEY constraint') && data.sqlError.includes('Users')) {
          errorTitle = '👤 Username Taken';
          errorMessage = 'This username is already in use. Please choose a different one.';
        } else if (response.status === 400) {
          errorTitle = '⚠️ Invalid Input';
          errorMessage = 'Please check your information and try again.';
        } else if (response.status === 409) {
          errorTitle = '⚠️ Account Exists';
          errorMessage = 'An account with this username or email already exists.';
        } else if (response.status === 500) {
          errorTitle = '🔧 Server Error';
          errorMessage = 'We\'re experiencing technical difficulties. Please try again later.';
        } else {
          errorTitle = '❌ Error';
          errorMessage = 'Something went wrong. Please try again.';
        }

        Alert.alert(
          errorTitle,
          errorMessage,
          [{ text: 'OK', style: 'default' }],
          { cancelable: true }
        );
      }
    } catch (error) {
      // Handle network and unexpected errors
      console.error("Signup error:", error);
      if (error instanceof TypeError && error.message.includes('Network')) {
        Alert.alert(
          '📡 Connection Error',
          'Unable to connect to our servers. Please check your internet connection and try again.',
          [{ text: 'OK', style: 'default' }],
          { cancelable: true }
        );
      } else {
        Alert.alert(
          '⚠️ Unexpected Error',
          'Something unexpected happened. Please try again later.',
          [{ text: 'OK', style: 'default' }],
          { cancelable: true }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Main container with safe area
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
       <View className="flex-1 px-3 pt-10">
          {/* Header section with back button */}
          <View className="flex-row items-center justify-between mb-6">
            {/* <Link href="../" asChild>
              <TouchableOpacity>
                <Ionicons name="arrow-back-circle" color="#3b82f6" size={32}  />
              </TouchableOpacity>
            </Link> */}
            <Text className="text-3xl font-extrabold text-[#2C3E50] flex-1 text-center mr-8">Create Your Account</Text>
          </View>

          {/* Form inputs container */}
          <View className="w-full">
            {/* First name input */}
            <View className="w-full h-[45px] border-[1.5px] border-[#E0E0E0] rounded-[10px] mb-3 bg-white flex-row items-center px-[15px] shadow-sm">
              <Ionicons name="person-outline" size={18} color="#95A5A6" className="mr-2" />
              <TextInput
                className="flex-1 text-sm text-[#2C3E50]"
                placeholder="First Name"
                placeholderTextColor="#95A5A6"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Middle name input */}
            <View className="w-full h-[45px] border-[1.5px] border-[#E0E0E0] rounded-[10px] mb-3 bg-white flex-row items-center px-[15px] shadow-sm">
              <Ionicons name="person-outline" size={18} color="#95A5A6" className="mr-2" />
              <TextInput
                className="flex-1 text-sm text-[#2C3E50]"
                placeholder="Middle Name"
                placeholderTextColor="#95A5A6"
                value={middleName}
                onChangeText={setMiddleName}
              />
            </View>

            {/* Last name input */}
            <View className="w-full h-[45px] border-[1.5px] border-[#E0E0E0] rounded-[10px] mb-3 bg-white flex-row items-center px-[15px] shadow-sm">
              <Ionicons name="person-outline" size={18} color="#95A5A6" className="mr-2" />
              <TextInput
                className="flex-1 text-sm text-[#2C3E50]"
                placeholder="Last Name"
                placeholderTextColor="#95A5A6"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Username input */}
            <View className="w-full h-[45px] border-[1.5px] border-[#E0E0E0] rounded-[10px] mb-3 bg-white flex-row items-center px-[15px] shadow-sm">
              <MaterialCommunityIcons name="account" size={18} color="#95A5A6" className="mr-2" />
              <TextInput
                className="flex-1 text-sm text-[#2C3E50]"
                placeholder="Username"
                autoCapitalize="none"
                placeholderTextColor="#95A5A6"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* Password input */}
            <View className="w-full h-[45px] border-[1.5px] border-[#E0E0E0] rounded-[10px] mb-3 bg-white flex-row items-center px-[15px] shadow-sm">
              <Ionicons name="lock-closed-outline" size={18} color="#95A5A6" className="mr-2" />
              <TextInput
                className="flex-1 text-sm text-[#2C3E50]"
                placeholder="Password"
                secureTextEntry
                placeholderTextColor="#95A5A6"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Email input */}
            <View className="w-full h-[45px] border-[1.5px] border-[#E0E0E0] rounded-[10px] mb-3 bg-white flex-row items-center px-[15px] shadow-sm">
              <MaterialCommunityIcons name="email-outline" size={18} color="#95A5A6" className="mr-2" />
              <TextInput
                className="flex-1 text-sm text-[#2C3E50]"
                placeholder="Email (Optional)"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#95A5A6"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Mobile number input */}
            <View className="w-full h-[45px] border-[1.5px] border-[#E0E0E0] rounded-[10px] mb-3 bg-white flex-row items-center px-[15px] shadow-sm">
              <Ionicons name="phone-portrait-outline" size={18} color="#95A5A6" className="mr-2" />
              <TextInput
                className="flex-1 text-sm text-[#2C3E50]"
                placeholder="Mobile Number"
                keyboardType="phone-pad"
                placeholderTextColor="#95A5A6"
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>

            {/* Terms and conditions checkbox */}
            <View className="flex-row items-center px-3 my-6">
              <Checkbox
                value={isChecked}
                onValueChange={setChecked}
                color={isChecked ? '#3498DB' : undefined}
              />
              <Text className="ml-2 px-1 text-[#7F8C8D] text-[12px]">By signing up for an account, you acknowledge and accept our
                <Text onPress={() => setShowModal(true)} className="text-[#3498DB] underline text-[12px] font-medium"> Data Privacy Statement.</Text>
              </Text>
            </View>
          </View>

          {/* Sign up button */}
          <TouchableOpacity
            className={`w-full h-[45px] rounded-[10px] mt-2.5 overflow-hidden ${!isChecked ? 'opacity-70' : ''}`}
            disabled={!isChecked || loading}
            onPress={handleSignUp}
          >
            <LinearGradient
              colors={isChecked ? ['#3498DB', '#2980B9'] : ['#BDC3C7', '#95A5A6']}
              className="flex-1 flex-row justify-center items-center"
            >
              <Text className="text-white text-base font-bold mr-2">{loading ? 'Signing Up...' : 'Sign Up'}</Text>
              <Ionicons name="arrow-forward" size={18} color="white" className="ml-1" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Privacy policy modal */}
          <Modal
            visible={showModal}
            animationType="slide"
            transparent={true}
          >
            <View className="flex-1 justify-center items-center bg-black/60 p-5">
              <View className="bg-white rounded-[15px] p-5 w-full max-h-[80%] shadow-lg">
                <Text className="text-xl font-bold mb-4 text-[#2C3E50] flex-row items-center">
                  <Ionicons name="shield-checkmark" size={20} color="#3498DB" className="mr-3" />
                  Privacy Statement
                </Text>
                <ScrollView className="max-h-[400px]">
                  <Text className="text-sm leading-6 text-[#34495E]">
                    In compliance with the requirements of Data Privacy Act of 2012, we would like to ask your consent to collect, store, retain, disclose, dispose and process your personal information. Your information will be used to receive authentication to access LSBIZ and others that require authentication. Furthermore, it will be utilized for future messaging applications developed by the ICT Department.
                    {'\n\n'}
                    Please be aware that your data will be kept secure and will not be shared with third parties. In case the personal information collected is no longer needed, an official procedure will be followed to dispose of the given data.
                    {'\n\n'}
                    You have the right to request access, correct, update, or withdraw your consent for the use of your personal data. Just contact our Data Protection Officer via email dpo@lemonsquare.com.ph or call (02) 8-983-9417 to 19 local 121
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  className="bg-[#3498DB] p-3 rounded-[10px] items-center mt-4 shadow-lg"
                  onPress={() => setShowModal(false)}
                >
                  <Text className="text-white text-sm font-semibold">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
    </View>
      </ScrollView>
    </SafeAreaView>
  );
}
