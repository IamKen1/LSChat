import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';
import { Ionicons } from '@expo/vector-icons';

interface GroupInvitation {
  group_id: number;
  group_name: string;
  description: string;
  inviter_name: string;
  role: string;
}

interface GroupInvitationsProps {
  onInvitationResponded: () => void;
}

const GroupInvitations: React.FC<GroupInvitationsProps> = ({ onInvitationResponded }) => {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) return;

      const response = await fetch(`${API_BASE_URL}/api/group-invitations/${userData.user.user_id}`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Error fetching group invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (groupId: number, response: 'accept' | 'reject') => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) return;

      const apiResponse = await fetch(`${API_BASE_URL}/api/respond-to-group-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupId,
          user_id: userData.user.user_id,
          response: response
        }),
      });

      if (apiResponse.ok) {
        // Remove this invitation from the list
        setInvitations(prevInvitations => 
          prevInvitations.filter(invite => invite.group_id !== groupId)
        );
        
        // Notify parent component
        onInvitationResponded();
        
        Alert.alert(
          'Success', 
          `Group invitation ${response === 'accept' ? 'accepted' : 'rejected'} successfully.`
        );
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      Alert.alert('Error', 'Failed to process your response.');
    }
  };

  if (loading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#6B21A8" />
      </View>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <View className="bg-purple-50 border-b border-purple-100">
      <TouchableOpacity 
        className="p-4 flex-row justify-between items-center" 
        onPress={() => setExpanded(!expanded)}
      >
        <View className="flex-row items-center">
          <Text className="text-lg font-bold text-purple-800">Group Invitations</Text>
          <View className="ml-2 bg-purple-200 px-2 py-1 rounded-full">
            <Text className="text-purple-800 font-bold">{invitations.length}</Text>
          </View>
        </View>
        <Text className="text-purple-800 ml-2 text-lg">{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      
      {expanded && (
        <View className="pb-4">
          <ScrollView 
            horizontal={false} 
            className="max-h-[300px]"
          >
            {invitations.map((invitation) => (
              <View 
                key={invitation.group_id} 
                className="mx-4 my-2 bg-white p-4 rounded-lg shadow-sm"
              >
                <Text className="text-lg font-bold text-gray-800">
                  {invitation.group_name}
                </Text>
                <Text className="text-gray-600 my-1">{invitation.description}</Text>
                <Text className="text-sm text-gray-500">
                  Invited by {invitation.inviter_name}
                </Text>
                
                <View className="flex-row justify-end mt-3 space-x-2">
                  <TouchableOpacity
                    className="px-4 py-2 bg-gray-200 rounded-lg"
                    onPress={() => handleInvitationResponse(invitation.group_id, 'reject')}
                  >
                    <Text className="text-gray-800">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="px-4  mx-2 py-2 bg-[#6B21A8] rounded-lg"
                    onPress={() => handleInvitationResponse(invitation.group_id, 'accept')}
                  >
                    <Text className="text-white">Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default GroupInvitations;
