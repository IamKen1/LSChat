import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  fullScreen = true 
}) => {
  return (
    <View 
      className={`justify-center items-center ${fullScreen ? 'flex-1' : 'py-8'}`}
    >
      <ActivityIndicator size="large" color="#6B21A8" />
      {message && <Text className="text-gray-500 mt-2">{message}</Text>}
    </View>
  );
};

export default Loading;
