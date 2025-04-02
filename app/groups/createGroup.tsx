import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../../config';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required.');
      return;
    }

    setLoading(true);
    try {
      const pubnubChannel = `group-${Date.now()}`;
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      
      if (!userData.user || !userData.user.user_id) {
        Alert.alert('Error', 'You need to be logged in to create a group');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/create-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description,
          created_by: userData.user.user_id,
          pubnub_channel: pubnubChannel,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Group created successfully.', [
          { text: 'OK', onPress: () => router.push('/home') },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to create group.');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'An error occurred while creating the group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LinearGradient colors={['#6B21A8', '#3B0764']} className="p-4">
        <Text className="text-white text-xl font-bold">Create Group</Text>
      </LinearGradient>
      <View className="p-4">
        <Text className="text-gray-700 font-semibold mb-2">Group Name</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4"
          placeholder="Enter group name"
          value={groupName}
          onChangeText={setGroupName}
        />
        <Text className="text-gray-700 font-semibold mb-2">Description</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4"
          placeholder="Enter group description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity
          className={`bg-[#6B21A8] p-4 rounded-lg ${loading ? 'opacity-50' : ''}`}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold">Create Group</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateGroup;
