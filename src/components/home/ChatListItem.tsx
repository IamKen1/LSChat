import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import UserAvatar from '../common/UserAvatar';

interface ChatListItemProps {
  id: string;
  name: string;
  token: string;
  lastMessage: string;
  time: string;
  isNewMessage: boolean;
  onPress: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  name,
  lastMessage,
  time,
  isNewMessage,
  onPress,
}) => {
  return (
    <TouchableOpacity
      className="flex-row p-4 border-b border-gray-200 bg-white shadow-sm rounded-lg m-2"
      onPress={onPress}
    >
      <UserAvatar 
        name={name || 'Unknown'} 
        size={50} 
        containerClassName="mr-3 bg-[#6B21A8]" 
        textClassName="text-white text-lg font-bold"
      />
      <View className="flex-1">
        <View className="flex-row justify-between mb-1">
          <Text 
            className={`text-base ${isNewMessage ? 'font-bold' : 'font-semibold'} flex-1 mr-2`} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {name}
          </Text>
          <Text className="text-xs text-gray-500">{time}</Text>
        </View>
        <Text 
          className={`text-sm ${isNewMessage ? 'font-bold text-black' : 'text-gray-500'}`} 
          numberOfLines={1}
        >
          {lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ChatListItem;
