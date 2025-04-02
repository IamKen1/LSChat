import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../../config';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Group {
  group_id: number;
  name: string;
  description: string;
}

const AddToGroup = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(true);
  const { contactId, contactName } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/fetch-groups?user_id=${userData.user.user_id}`);
        if (response.ok) setGroups(await response.json());
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setFetchingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  const handleAddToGroup = async (groupId: number) => {
    // Show confirmation dialog before proceeding
    Alert.alert(
      'Confirmation',
      `Are you sure you want to invite ${contactName} to this group?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes, Invite',
          onPress: async () => {
            setLoading(true);
            try {
              const parsedContactId = typeof contactId === 'string' ? parseInt(contactId, 10) : contactId;
              
              const response = await fetch(`${API_BASE_URL}/api/add-group-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  group_id: groupId,
                  user_id: parsedContactId,
                  role: 'member',
                }),
              });

              const data = await response.json();
              if (data.success) {
                Alert.alert('Success', `Invitation sent to ${contactName} successfully.`, [
                  { text: 'OK', onPress: () => router.push('/home') },
                ]);
              } else {
                Alert.alert('Error', data.error || 'Failed to send group invitation.');
              }
            } catch (error) {
              console.error('Error sending group invitation:', error);
              Alert.alert('Error', 'An error occurred while sending the invitation.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LinearGradient colors={['#6B21A8', '#3B0764']} className="p-4">
        <Text className="text-white text-xl font-bold">Add {contactName} to Group</Text>
      </LinearGradient>
      {fetchingGroups ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6B21A8" />
        </View>
      ) : (
        <ScrollView className="p-4">
          {groups.length > 0 ? (
            groups.map((group) => (
              <TouchableOpacity
                key={group.group_id}
                className={`p-4 border border-gray-300 rounded-lg mb-4 ${loading ? 'opacity-50' : ''}`}
                onPress={() => handleAddToGroup(group.group_id)}
                disabled={loading}
              >
                <Text className="text-gray-800 font-bold">{group.name}</Text>
                <Text className="text-gray-600">{group.description}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500">No groups available to add this contact.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default AddToGroup;
