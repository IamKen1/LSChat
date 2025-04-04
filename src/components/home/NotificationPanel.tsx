import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { formatTime } from '../../utils/dateFormat';

interface UnreadMessage {
  id: number;
  token: string;
  message: string;
  created_at: string;
  groupName: string;
  is_read: number;
}

interface NotificationPanelProps {
  unreadMessages: UnreadMessage[];
  onMessagePress: (token: string) => void;
  onOutsidePress: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  unreadMessages,
  onMessagePress,
  onOutsidePress,
}) => {
  return (
    <>
      <TouchableOpacity
        className="absolute inset-0 z-40"
        onPress={onOutsidePress}
        activeOpacity={1}
      />
      <View className="absolute top-[80] right-4 w-[300] bg-white rounded-lg shadow-lg z-50 max-h-[400] overflow-hidden">
        <View className="p-3 border-b border-gray-200">
          <Text className="font-bold text-lg">Notifications</Text>
        </View>
        <ScrollView className="max-h-[350]">
          {unreadMessages.length > 0 ? (
            unreadMessages.map(message => (
              <TouchableOpacity
                key={message.id}
                className="p-4 border-b border-gray-100"
                onPress={() => onMessagePress(message.token)}
              >
                <Text className="font-semibold">{message.groupName}</Text>
                <Text className="text-gray-600" numberOfLines={1}>{message.message}</Text>
                <Text className="text-xs text-gray-400 mt-1">
                  {formatTime(message.created_at, true)}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View className="p-4 items-center">
              <Text className="text-gray-500">No new notifications</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
};

export default NotificationPanel;
