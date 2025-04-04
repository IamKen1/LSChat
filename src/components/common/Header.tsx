import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  gradient?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  gradient = true,
  containerStyle,
  titleStyle,
}) => {
  const router = useRouter();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const HeaderContent = () => (
    <View className="p-4 flex-row items-center" style={containerStyle}>
      {showBackButton && (
        <TouchableOpacity onPress={handleBackPress} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      )}
      <Text 
        className="text-white text-xl font-bold ml-2" 
        style={titleStyle}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View className="flex-1" />
      {rightComponent}
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient colors={['#6B21A8', '#3B0764']}>
        <HeaderContent />
      </LinearGradient>
    );
  }

  return (
    <View className="bg-[#6B21A8]">
      <HeaderContent />
    </View>
  );
};

export default Header;
