import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Image, ImageBackground, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config';
// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface HeaderProps {
  firstName: string;
  toggleMenu: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unreadMessages: number;
  onNotificationPress: () => void;
}

// Renders the app header with user info and search functionality
const Header = React.memo<HeaderProps>(({ firstName, toggleMenu, searchQuery, setSearchQuery, unreadMessages, onNotificationPress }) => (
  <LinearGradient colors={['#f47a04', '#c66203']} className="p-4 shadow-lg">
    <View className="flex-col">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={toggleMenu} className="w-12 h-12 rounded-full bg-white/90 justify-center items-center shadow-sm">
            <Text className="text-[#c66203] text-xl font-bold" style={{ fontFamily: 'System' }}>{firstName[0]}</Text>
          </TouchableOpacity>
          <View className="flex-col items-start flex-1">
            <Text className="text-sm text-white/80 tracking-wider font-medium shadow-sm-">Welcome,</Text>
            <Text className="text-2xl font-bold text-white tracking-wider w-full" numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: 'System' }}>{firstName}</Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-full bg-white/90 justify-center items-center shadow-sm"
            onPress={onNotificationPress}
          >
            <Icon name="notifications" size={22} color="#c66203" />
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
          <Icon name="search" size={22} color="#c66203" className="mr-2" />
          <Text className="flex-1 text-sm text-gray-600 font-medium">Search messages...</Text>
        </TouchableOpacity>
      </View>
    </View>
  </LinearGradient>
));

interface TabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showComingSoonAlert: (feature: string) => void;
}

// Displays navigation tabs for different sections of the app
const TabBar = React.memo<TabBarProps>(({ activeTab, setActiveTab, showComingSoonAlert }) => (
  <View className="flex-row bg-secondary p-2 my-1  shadow-md">
    <TouchableOpacity
      className={`flex-1 py-2 items-center rounded-lg flex-row justify-center gap-2 ${activeTab === 'Chats' ? 'bg-gray-200 shadow-sm' : ''}`}
      onPress={() => setActiveTab('Chats')}
    >
      <Icon name="chat" size={24} color={activeTab === 'Chats' ? '#c66203' : '#666666'} />
      <Text className={`text-sm font-medium ${activeTab === 'Chats' ? 'text-dark' : 'text-gray-500'}`}>Chats</Text>
    </TouchableOpacity>
    <TouchableOpacity
      className="flex-1 py-2 items-center rounded-lg flex-row justify-center gap-2"
      onPress={() => showComingSoonAlert('Groups')}
    >
      <Icon name="group" size={24} color="#666666" />
      <Text className="text-sm font-medium text-gray-500">Groups</Text>
    </TouchableOpacity>
    <TouchableOpacity
      className="flex-1 py-2 items-center rounded-lg flex-row justify-center gap-2"
      onPress={() => showComingSoonAlert('Contacts')}
    >
      <Icon name="contacts" size={24} color="#666666" />
      <Text className="text-sm font-medium text-gray-500">Contacts</Text>
    </TouchableOpacity>
  </View>
));

interface ChatListProps {
  chatGroups: Array<{
    id: string;
    name: string;
    token: string;
    lastMessage: string;
    time: string;
    isNewMessage: boolean;
    lastMessageId: string;
  }>;
  handleChatPress: (token: string) => void;
}

// Renders the list of chat conversations
const ChatList = React.memo<ChatListProps>(({ chatGroups, handleChatPress }) => (

  <ScrollView className="flex-1">
    {chatGroups.map((group) => (
      <TouchableOpacity
        key={group.id}
        className="flex-row p-4 border-b border-gray-200 bg-white shadow-sm rounded-lg m-2"
        onPress={() => handleChatPress(group.token)}
      >
        <View className="w-[50px] h-[50px] rounded-full bg-[#c66203] justify-center items-center mr-3">
          <Text className="text-white text-xl font-bold">{group.name.split(' ').length > 1 ? group.name.split(' ').map(word => word[0]).slice(0, 2).join('') : group.name[0]}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between mb-1">
            <Text className="text-base font-semibold flex-1 mr-2" numberOfLines={1} ellipsizeMode="tail">{group.name}</Text>
            <Text className="text-xs text-gray-500">{group.time}</Text>
          </View>
          <Text className={`text-sm text-gray-500 ${group.isNewMessage ? 'font-bold' : ''}`} numberOfLines={1}>
            {group.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
));

// Main screen component managing chat functionality and user interface
const HomeScreen = React.memo(() => {
  const [firstName, setFirstName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatGroups, setChatGroups] = useState<Array<{
    id: string;
    name: string;
    token: string;
    lastMessage: string;
    time: string;
    isNewMessage: boolean;
    lastMessageId: string;
  }>>([]);
  const [lastMessageIds, setLastMessageIds] = useState<{ [key: string]: string }>({});
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [notifiedMessageIds, setNotifiedMessageIds] = useState<Set<string>>(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]); const [unreadCount, setUnreadCount] = useState(0);

  const handleNotificationPress = () => {
    setShowNotifications(!showNotifications);
  };

  // Update the getUnreadCount function to use the API
  const getUnreadCount = async () => {
    let totalUnread = 0;

    for (const group of chatGroups) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/messages/unread/${group.token}`);
        if (response.ok) {
          const data = await response.json();
          totalUnread += data.unreadCount;
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    }

    return totalUnread;
  };
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      const allUnreadMessages = [];
      for (const group of chatGroups) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/messages/unread/data/${group.token}`);
          if (response.ok) {
            const messages = await response.json();
            allUnreadMessages.push(...messages.map((msg: any) => ({
              ...msg,
              groupName: group.name // Add group name to message data
            })));
          }
        } catch (error) {
          console.error('Error fetching unread messages:', error);
        }
      }
      setUnreadMessages(allUnreadMessages);
    };

    if (showNotifications) {
      fetchUnreadMessages();
    }
  }, [showNotifications, chatGroups]);
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  // Add this effect to periodically update unread count
  useEffect(() => {
    const updateUnreadCount = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 30000); // Increased interval to 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [chatGroups, getUnreadCount]); // Added getUnreadCount to dependency array

  // Handles push notification permissions 
  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus === 'granted') {
        setNotificationPermission(true);
      } else {
        Alert.alert('Failed to get push token for push notification!');
        setNotificationPermission(false);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      setNotificationPermission(false);
    }
  };

  // Fetches and updates chat data periodically
  useEffect(() => {
    const fetchSavedPortals = async () => {
      try {
        const userSessionData = await AsyncStorage.getItem('userSession');
        if (userSessionData) {
          const userData = JSON.parse(userSessionData);
          setFirstName(userData.user.first_name);
          const response = await fetch(`${API_BASE_URL}/api/fetchAccounts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userData.user.user_id
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {

              const allPortals = Array.isArray(data.user) ? data.user : [data.user];
              const savedPortals = allPortals.filter((portal: any) => portal.status === 'active');
            
              // Fetch all messages in parallel
              const messagePromises = savedPortals.map((portal: any) =>
                fetch(`${API_BASE_URL}/api/messages/${portal.channel}`)
                  .then(res => res.json())
                  .catch(error => {
                    console.error('Error fetching messages at home:', error);
                    return [];
                  })
              );

              const allMessages = await Promise.all(messagePromises);
              const updatedPortals = savedPortals.map((portal: any, index: number) => {
                const messageData = allMessages[index];
                const lastMessage = messageData.length > 0 ? messageData[messageData.length - 1].message : 'No messages yet';             
                const lastMessageTime = messageData.length > 0 ? messageData[messageData.length - 1].created_at : '';
                const lastMessageId = messageData.length > 0 ? messageData[messageData.length - 1].id : null;
                const unreadCount = messageData.filter((msg: any) => msg.is_read === 0).length;
                const isNewMessage = unreadCount > 0;
               
                if (notificationPermission && lastMessageId && isNewMessage && !notifiedMessageIds.has(lastMessageId)) {
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: portal.name,
                      body: lastMessage,
                    },
                    trigger: null,
                  }).catch(error => {
                    console.error('Error scheduling notification:', error);
                  });
                  setNotifiedMessageIds(prev => new Set([...prev, lastMessageId]));
                }

                return {
                  ...portal,
                  lastMessage,
                  lastMessageId,
                  isNewMessage,
                  time: lastMessageTime ? new Date(lastMessageTime).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                    timeZone: 'UTC',
                  }) : ''
                };
              });

              const formattedGroups = updatedPortals.map((portal: any) => ({
                id: portal.id,
                name: portal.name,
                token: portal.channel,
                lastMessage: portal.lastMessage || 'No messages yet',
                time: portal.time || '',
                isNewMessage: portal.isNewMessage || false,
                lastMessageId: portal.lastMessageId || ''
              }));
              setChatGroups(formattedGroups);
              const newLastMessageIds = formattedGroups.reduce((acc: any, group: any) => {
                if (group.lastMessageId) {
                  acc[group.token] = group.lastMessageId;
                }
                return acc;
              }, {});
              setLastMessageIds(newLastMessageIds);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching saved portals:', error);
      }
    };
    fetchSavedPortals();
    const interval = setInterval(fetchSavedPortals, 5000);
    return () => clearInterval(interval);

  }, [notificationPermission, notifiedMessageIds]);


  // Navigates to account management screen
  const navigateToAccount = () => {
    setMenuVisible(false);
    router.push('/accountManager');
  };

  // Navigates to profile management screen
  const navigateProfile = () => {
    setMenuVisible(false);
    router.push('/profileManagement');
  };

  // Toggles the side menu visibility
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Handles chat selection and marks messages as read
  const handleChatPress = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/update/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const updatedChatGroups = chatGroups.map(group => {
          if (group.token === token) {
            return { ...group, isNewMessage: false };
          }
          return group;
        });
        setChatGroups(updatedChatGroups);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }

    router.push({
      pathname: "/chat/[token]",
      params: { token }
    });
  };

  // Handles user logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userSession');
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Shows alert for upcoming features
  const showComingSoonAlert = (feature: string) => {
    Alert.alert(
      'Coming Soon!',
      `We're working hard to bring you an amazing ${feature} feature. Stay tuned for updates!`,
      [
        {
          text: 'okay',
          style: 'default'
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <Header
        firstName={firstName}
        toggleMenu={toggleMenu}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unreadMessages={unreadCount}
        onNotificationPress={handleNotificationPress}
      />
      {showNotifications && (
        <>
          <TouchableOpacity
            className="absolute inset-0 z-40"
            onPress={() => setShowNotifications(false)}
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
                    onPress={() => {
                      handleChatPress(message.token);
                      setShowNotifications(false);
                    }}
                  >
                    <Text className="font-semibold">{message.groupName}</Text>
                    <Text className="text-gray-600" numberOfLines={1}>{message.message}</Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      {new Date(message.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                        timeZone: 'UTC',
                      })}
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
      )}
      <TabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showComingSoonAlert={showComingSoonAlert}
      />
      <ChatList
        chatGroups={chatGroups}
        handleChatPress={handleChatPress}
      />
      {menuVisible && (
        <>
          <TouchableOpacity
            className="absolute inset-0 bg-black/60 z-50"
            onPress={toggleMenu}
            activeOpacity={1}
          />
          <View className="absolute bottom-0 left-0 bg-white w-[70%] h-full z-[1000] rounded-tr-3xl">
            <LinearGradient colors={['#f47a04', '#c66203']} className="p-4 items-center shadow-lg">
              <View className="items-center mb-2" >
                <View className="bg-white p-5 rounded-full mb-6 shadow-lg">
                  <Ionicons name="chatbubbles" size={50} color="#f47a04" />
                </View>
                <Text className="text-4xl font-black text-white mb-3 tracking-wider">LS Chat</Text>
                <Text className="text-lg text-blue-100">Lemon Square Chat App</Text>
              </View>
            </LinearGradient>

            <View className="px-2 mt-4">
              <TouchableOpacity
                className="flex-row items-center p-4 mb-2 rounded-2xl hover:bg-gray-50 active:bg-gray-100"
                onPress={navigateProfile}
              >
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <Icon name="account-circle" size={24} color="#c66203" />
                </View>
                <Text className="ml-4 text-base font-semibold text-gray-800">Profile Management</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 mb-2 rounded-2xl hover:bg-gray-50 active:bg-gray-100"
                onPress={navigateToAccount}
              >
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <Icon name="list" size={24} color="#c66203" />
                </View>
                <Text className="ml-4 text-base font-semibold text-gray-800">Account Manager</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center p-5 mt-auto bg-red-50 active:bg-red-100"
              onPress={handleLogout}
            >
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                <Icon name="logout" size={24} color="#c66203" />
              </View>
              <Text className="ml-4 text-base font-semibold text-red-600">Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );

});

export default HomeScreen;



