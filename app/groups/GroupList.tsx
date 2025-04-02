import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { API_BASE_URL } from '../../config';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Group {
  group_id: number;
  name: string;
  description: string;
  pubnub_channel: string;
  role: string;
  created_at: string;
}

const GroupList = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
        const response = await fetch(`${API_BASE_URL}/api/fetch-groups?user_id=${userData.user.user_id}`);
        const data = await response.json();
        if (response.ok) setGroups(data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      key={item.group_id}
      className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
      onPress={() =>
        router.push({
          pathname: '/chat/groupChat',
          params: { groupId: item.group_id, groupName: item.name },
        })
      }
    >
      <View className="flex-row items-center p-4">
        <View className="w-16 h-16 rounded-full overflow-hidden mr-4">
          <View className="w-full h-full bg-[#6B21A8] items-center justify-center">
            <Text className="text-2xl font-bold text-white">{getInitials(item.name)}</Text>
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
            {item.role === 'admin' && (
              <View className="bg-purple-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-purple-800 font-medium">Admin</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-600 mt-1" numberOfLines={2}>{item.description || 'No description'}</Text>
          <View className="flex-row items-center mt-2">
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text className="text-xs text-gray-400 ml-1">
              Created {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6B21A8" />
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-4">
        <View className="w-24 h-24 rounded-full overflow-hidden bg-purple-50">
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="people" size={64} color="#6B21A8" />
          </View>
        </View>
        <Text className="text-xl font-bold text-gray-400 mb-2">No Groups Yet</Text>
        <Text className="text-gray-400 text-center mb-6">
          Create your first group to start chatting with multiple contacts at once
        </Text>
        <TouchableOpacity 
          className="bg-[#6B21A8] py-3 px-6 rounded-full flex-row items-center"
          onPress={() => router.push('/groups/createGroup')}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-bold ml-2">Create a Group</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.group_id.toString()}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default GroupList;
