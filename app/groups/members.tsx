import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../../config';
import Header from '../../src/components/common/Header';
import Loading from '../../src/components/common/Loading';
import UserAvatar from '../../src/components/common/UserAvatar';
import EmptyState from '../../src/components/common/EmptyState';

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
      <UserAvatar name={item.name} size={48} containerClassName="mr-4" />
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
        <Header title={groupName ? `${groupName} - Members` : 'Group Members'} />
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title={groupName ? `${groupName} - Members` : 'Group Members'} />
      
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
        <EmptyState 
          iconName="people" 
          title="No members found"
          message="This group doesn't have any members yet."
        />
      )}
    </SafeAreaView>
  );
};

export default Members;
