import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  iconName,
  title,
  message,
  actionText,
  onAction,
}) => {
  return (
    <View className="flex-1 justify-center items-center p-4">
      <Ionicons name={iconName} size={64} color="#d1d5db" />
      <Text className="text-xl font-semibold text-gray-400 mt-4">{title}</Text>
      {message && <Text className="text-gray-400 text-center mt-2 mb-6">{message}</Text>}
      
      {actionText && onAction && (
        <TouchableOpacity 
          className="bg-[#6B21A8] py-3 px-6 rounded-full flex-row items-center"
          onPress={onAction}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-bold ml-2">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
