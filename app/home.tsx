import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';


// Components
import HomeHeader from '../src/components/home/HomeHeader';
import HomeTabBar from '../src/components/home/HomeTabBar';
import ChatList from '../src/components/home/ChatList';
import NotificationPanel from '../src/components/home/NotificationPanel';
import SideMenu from '../src/components/home/SideMenu';
import GroupList from './groups/GroupList';
import ContactLists from './contact-lists';

// Hooks
import useHomeChat from '../src/hooks/useHomeChat';

const HomeScreen = () => {
  // State
  const [firstName, setFirstName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Chats');
  
  // Custom hook for chat functionality
  const { 
    chatState, 
    toggleNotifications, 
    handleGroupChatPress, 
    handleOneOnOneChatPress,
    refreshData
  } = useHomeChat();

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userSessionData = await AsyncStorage.getItem('userSession');
        if (userSessionData) {
          const userData = JSON.parse(userSessionData);
          setFirstName(userData.user.first_name);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  // Show alert for features that are coming soon
  const showComingSoonAlert = useCallback((feature: string) => {
    Alert.alert(
      'Coming Soon!',
      `We're working hard to bring you an amazing ${feature} feature. Stay tuned for updates!`,
      [{ text: 'OK', style: 'default' }],
      { cancelable: true }
    );
  }, []);

  // Handle user logout
  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userSession');
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  // Handle closing the side menu
  const closeSideMenu = useCallback(() => {
    console.log('Closing side menu'); // Debug log
    setMenuVisible(false);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      {/* Header */}
      <HomeHeader
        firstName={firstName}
        toggleMenu={() => setMenuVisible(true)}
        unreadMessages={chatState.unreadCount}
        onNotificationPress={toggleNotifications}
      />

      {/* Notifications Panel */}
      {chatState.showNotifications && (
        <NotificationPanel
          unreadMessages={chatState.unreadMessages}
          onMessagePress={(token) => handleGroupChatPress(token)}
          onOutsidePress={() => toggleNotifications()}
        />
      )}

      {/* Tab Bar */}
      <HomeTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showComingSoonAlert={showComingSoonAlert}
      />

      {/* Main Content Area */}
      {activeTab === 'Chats' ? (
        <ChatList
          chatGroups={chatState.groups}
          oneOnOneChats={chatState.oneOnOneChats}
          handleChatPress={handleGroupChatPress}
          handleOneOnOnePress={handleOneOnOneChatPress}
          refreshGroupsData={refreshData}
        />
      ) : activeTab === 'Groups' ? (
        <GroupList />
      ) : (
        <ContactLists />
      )}

      {/* Footer */}
      <View className="items-center pb-3">
        <Text className="text-black/70 text-sm">Powered by ICTD</Text>
      </View>

      {/* Side Menu with improved handling */}
      <SideMenu
        visible={menuVisible}
        onClose={closeSideMenu}
        onProfilePress={() => {
          router.push('/profileManagement');
        }}
        onAccountPress={() => {
          router.push('/accountManager');
        }}
        onLogoutPress={handleLogout}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;



