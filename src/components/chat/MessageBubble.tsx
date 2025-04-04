import React from 'react';
import { View, Text, Image } from 'react-native';

interface MessageBubbleProps {
  id: string;
  message: string;
  isCurrentUser: boolean;
  senderName: string;
  timestamp: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  senderName,
  timestamp,
}) => {
  const isImageUrl = (url: string) => /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(url);

  const renderMessageContent = (content: string) => {
    const parts = content.split(/\[(?:Image|File): (.+?)\]/); // Match both [Image: URL] and [File: URL]
    return parts.map((part, index) => {
      if (isImageUrl(part)) {
        return (
          <Image
            key={index}
            source={{ uri: part }}
            className="w-full h-40 rounded-lg mt-2"
            resizeMode="cover"
          />
        );
      }
      return (
        <Text
          key={index}
          className={`text-sm ${isCurrentUser ? 'text-black' : 'text-white'} ${
            index > 0 ? 'mt-2' : ''
          }`}
        >
          {part.trim()}
        </Text>
      );
    });
  };

  return (
    <View
      className={`p-3 m-2 max-w-[80%] rounded-lg ${
        isCurrentUser ? 'bg-gray-200 self-end' : 'bg-[#6B21A8] self-start'
      }`}
    >
      <Text className={`text-xs ${isCurrentUser ? 'text-gray-500' : 'text-white/70'}`}>
        {isCurrentUser ? 'You' : senderName}
      </Text>
      
      {renderMessageContent(message)}
      
      <Text className={`text-xs ${isCurrentUser ? 'text-gray-400' : 'text-white/70'} mt-1 text-right`}>
        {timestamp}
      </Text>
    </View>
  );
};

export default MessageBubble;
