import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showComingSoonAlert: (feature: string) => void;
}

const HomeTabBar: React.FC<TabBarProps> = ({ 
  activeTab, 
  setActiveTab, 
  showComingSoonAlert 
}) => (
  <View className="flex-row bg-secondary p-2 my-1 shadow-md">
    <TouchableOpacity
      className={`flex-1 py-2 items-center rounded-lg flex-row justify-center gap-2 ${activeTab === 'Chats' ? 'bg-gray-200 shadow-sm' : ''}`}
      onPress={() => setActiveTab('Chats')}
    >
      <Icon name="chat" size={24} color={activeTab === 'Chats' ? '#6B21A8' : '#666666'} />
      <Text className={`text-sm font-medium ${activeTab === 'Chats' ? 'text-dark' : 'text-gray-500'}`}>Chats</Text>
    </TouchableOpacity>
    <TouchableOpacity
      className={`flex-1 py-2 items-center rounded-lg flex-row justify-center gap-2 ${activeTab === 'Groups' ? 'bg-gray-200 ' : ''}`}
      onPress={() => setActiveTab('Groups')}
    >
      <Icon name="group" size={24} color={activeTab === 'Groups' ? '#6B21A8' : '#666666'} />
      <Text className={`text-sm font-medium ${activeTab === 'Groups' ? 'text-dark' : 'text-gray-500'}`}>Groups</Text>
    </TouchableOpacity>
    <TouchableOpacity
      className="flex-1 py-2 items-center rounded-lg flex-row justify-center gap-2"
      onPress={() => setActiveTab('Contacts')}
    >
      <Icon name="contacts" size={24} color={activeTab === 'Contacts' ? '#6B21A8' : '#666666'} />
      <Text className="text-sm font-medium text-gray-500">Contacts</Text>
    </TouchableOpacity>
  </View>
);

export default HomeTabBar;
