import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../../config';
import { Ionicons } from '@expo/vector-icons';

interface Member {
  user_id: number;
  name: string;
  role: string;
}

const Members = () => {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string, groupName?: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/group-members?group_id=${groupId}`);
        const data = await response.json();
        if (response.ok) setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const renderMember = ({ item }: { item: Member }) => (
    <View className="flex-row items-center p-4 border-b border-gray-200">
      <View className="w-12 h-12 rounded-full bg-[#6B21A8] items-center justify-center mr-4">
        <Text className="text-lg font-bold text-white">{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-semibold text-lg">{item.name}</Text>
      </View>
      <View className={`px-3 py-1 rounded-full ${item.role === 'admin' ? 'bg-purple-100' : 'bg-gray-100'}`}>
        <Text className={`text-xs font-medium ${item.role === 'admin' ? 'text-purple-800' : 'text-gray-600'}`}>
          {item.role}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6B21A8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-[#6B21A8] p-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">
          {groupName ? `${groupName} - ` : ''}Group Members
        </Text>
      </View>
      
      <View className="p-4 bg-white">
        <Text className="text-sm text-gray-500">{members.length} members</Text>
      </View>
      
      {members.length > 0 ? (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.user_id.toString()}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="people" size={64} color="#d1d5db" />
          <Text className="text-xl font-semibold text-gray-400 mt-4">No members found</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Members;
