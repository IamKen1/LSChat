import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Alert } from 'react-native';
import UserAvatar from '../common/UserAvatar';

interface HomeHeaderProps {
  firstName: string;
  toggleMenu: () => void;
  unreadMessages: number;
  onNotificationPress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ 
  firstName, 
  toggleMenu, 
  unreadMessages, 
  onNotificationPress 
}) => (
  <LinearGradient colors={['#6B21A8', '#3B0764']} className="p-4 ">
    <View className="flex-col">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity 
            onPress={toggleMenu} 
          
            activeOpacity={0.8}
          >
            {firstName ? (
              <View className="w-12 h-12 rounded-full  overflow-hidden">
                <LinearGradient 
                  colors={['#FFFFFF', '#FFFFFF']}                   
                  className="w-full h-full items-center justify-center"
                >
                  <Text className="text-black text-xl font-bold">
                    {firstName.slice(0, 1).toUpperCase()}
                  </Text>
                </LinearGradient>
              </View>
            ) : (
              <View className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                <LinearGradient 
                  colors={['#8E24AA', '#6B21A8']} 
                  className="w-full h-full items-center justify-center"
                >
                  <Text className="text-white text-xl font-bold">U</Text>
                </LinearGradient>
              </View>
            )}
          </TouchableOpacity>
          <View className="flex-col items-start flex-1">
            <Text className="text-sm ml-2 text-gray-400 tracking-wider font-medium shadow-sm-">Welcome,</Text>
            <Text className="text-2xl ml-2 font-bold text-white tracking-wider w-full" numberOfLines={1} ellipsizeMode="tail">
              {firstName || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-full bg-white/90 justify-center items-center shadow-sm"
            onPress={onNotificationPress}
          >
            <Icon name="notifications" size={22} color="#3B0764" />
            {unreadMessages > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-6 h-6 justify-center items-center border-2 border-white">
                <Text className="text-white text-xs font-bold">{unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View className="mt-4">
        <TouchableOpacity
          className="flex-row items-center bg-white/90 rounded-full px-4 h-11 shadow-sm"
          onPress={() => Alert.alert('Coming Soon!', 'Search feature coming soon!')}
        >
          <Text className="text-[#8E24AA] text-xl mx-2">🔍</Text>
          <Text className="flex-1 text-sm text-gray-600 font-medium">Search messages...</Text>
        </TouchableOpacity>
      </View>
    </View>
  </LinearGradient>
);

export default HomeHeader;
