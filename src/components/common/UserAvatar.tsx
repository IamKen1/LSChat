import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

interface UserAvatarProps {
  name: string;
  size?: number;
  containerStyle?: ViewStyle;
  textClassName?: string;
  containerClassName?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 40,
  containerStyle,
  textClassName = "text-white text-lg font-bold",
  containerClassName = "bg-[#6B21A8]",
}) => {
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string' || name.trim() === '') return '?';
    
    const initials = name
      .split(' ')
      .filter(Boolean) // Remove empty parts
      .map(word => word[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
      
    return initials || '?'; // Default to '?' if we end up with empty string
  };

  const initials = getInitials(name);
  const fontSize = Math.max(size * 0.4, 14); // Ensure minimum readable font size

  return (
    <View
      className={`rounded-full items-center justify-center ${containerClassName}`}
      style={[
        {
          width: size,
          height: size,
          backgroundColor: '#6B21A8', // Default background color
        },
        containerStyle,
      ]}
    >
      <Text 
        className={textClassName}
        style={{ 
          fontSize: fontSize,
          fontWeight: 'bold',
            color: 'white', // Default text color
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

export default UserAvatar;
