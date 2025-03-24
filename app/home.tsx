import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config';
import ContactLists from './contact-lists';

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
  <LinearGradient colors={['#6B21A8', '#3B0764']} className="p-4 shadow-lg">
    <View className="flex-col">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={toggleMenu} className="w-12 h-12 rounded-full bg-white/90 justify-center items-center shadow-sm">
            <Text className="text-[#3B0764] text-xl font-bold" style={{ fontFamily: 'System' }}>{firstName[0]}</Text>
          </TouchableOpacity>
          <View className="flex-col items-start flex-1">
            <Text className="text-sm text-white/80 tracking-wider font-medium shadow-sm-">Welcome,</Text>
            <Text className="text-2xl font-bold text-white tracking-wider w-full" numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: 'System' }}>{firstName}</Text>
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
      <Icon name="chat" size={24} color={activeTab === 'Chats' ? '#6B21A8' : '#666666'} />
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
      <Icon name="contacts" size={24} color={activeTab === 'Contacts' ? '#6B21A8' : '#666666'} />
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
  <View className="flex-1">
    <ScrollView className="flex-1">
      {chatGroups.map((group) => (
        <TouchableOpacity
          key={group.id}
          className="flex-row p-4 border-b border-gray-200 bg-white shadow-sm rounded-lg m-2"
          onPress={() => handleChatPress(group.token)}
        >
          <View className="w-[50px] h-[50px] rounded-full bg-[#6B21A8] justify-center items-center mr-3">
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
    {/* hide message icon for now */}
    {/* <TouchableOpacity
      className="absolute bottom-4 right-4 w-14 h-14 bg-[#6B21A8] rounded-full justify-center items-center shadow-lg"
      onPress={() => router.push('/chat/newMessage')}
    >
      <Icon name="message" size={28} color="white" />
    </TouchableOpacity> */}
  </View>
));

// Add proper interfaces
interface ChatGroup {
  id: string;
  name: string;
  token: string;
  lastMessage: string;
  time: string;
  isNewMessage: boolean;
  lastMessageId: string;
}

interface UserState {
  firstName: string;
  menuVisible: boolean;
  activeTab: string;
  searchQuery: string;
}

// Add new interface for unread messages
interface UnreadMessage {
  id: number;
  token: string;
  message: string;
  created_at: string;
  groupName: string;
  is_read: number;
}

interface ChatState {
  groups: ChatGroup[];
  lastMessageIds: Record<string, string>;
  unreadMessages: UnreadMessage[]; // Update type from any[] to UnreadMessage[]
  unreadCount: number;
  showNotifications: boolean;
}

interface NotificationState {
  permission: boolean;
  notifiedIds: Set<string>;
}

// Main screen component managing chat functionality and user interface
const HomeScreen = React.memo(() => {
  // Fix state typing
  const [userState, setUserState] = useState<UserState>({
    firstName: '',
    menuVisible: false,
    activeTab: 'Chats',
    searchQuery: '',
  });

  const [chatState, setChatState] = useState<ChatState>({
    groups: [],
    lastMessageIds: {},
    unreadMessages: [],
    unreadCount: 0,
    showNotifications: false,
  });

  const [notificationState, setNotificationState] = useState<NotificationState>({
    permission: false,
    notifiedIds: new Set<string>(),
  });

  const handleNotificationPress = () => {
    setChatState(prevState => ({
      ...prevState,
      showNotifications: !prevState.showNotifications,
    }));
  };

  // Memoize callbacks
  const getUnreadCount = useCallback(async () => {
    let totalUnread = 0;
    for (const group of chatState.groups) {
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
  }, [chatState.groups]);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      const allUnreadMessages: UnreadMessage[] = []; 
      for (const group of chatState.groups) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/messages/unread/data/${group.token}`);
          if (response.ok) {
            const messages: Omit<UnreadMessage, 'groupName'>[] = await response.json();
            allUnreadMessages.push(...messages.map(msg => ({
              ...msg,
              groupName: group.name
            })));
          }
        } catch (error) {
          console.error('Error fetching unread messages:', error);
        }
      }
      setChatState(prevState => ({
        ...prevState,
        unreadMessages: allUnreadMessages,
      }));
    };

    if (chatState.showNotifications) {
      fetchUnreadMessages();
    }
  }, [chatState.showNotifications, chatState.groups]);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  // Fix dependency array in effects
  useEffect(() => {
    const updateUnreadCount = async () => {
      const count = await getUnreadCount();
      setChatState(prev => ({ ...prev, unreadCount: count }));
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 30000); // Increased interval to 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [getUnreadCount]);

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
        setNotificationState(prevState => ({
          ...prevState,
          permission: true,
        }));
      } else {
        Alert.alert('Failed to get push token for push notification!');
        setNotificationState(prevState => ({
          ...prevState,
          permission: false,
        }));
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      setNotificationState(prevState => ({
        ...prevState,
        permission: false,
      }));
    }
  };

  // Fetches and updates chat data periodically
  useEffect(() => {
    const fetchSavedPortals = async () => {
      try {
        const userSessionData = await AsyncStorage.getItem('userSession');
        if (userSessionData) {
          const userData = JSON.parse(userSessionData);
          setUserState(prevState => ({
            ...prevState,
            firstName: userData.user.first_name,
          }));
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

              const allPortals = Array.isArray(data.accounts) ? data.accounts : [data.accounts];
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

                if (notificationState.permission && lastMessageId && isNewMessage && !notificationState.notifiedIds.has(lastMessageId)) {
                  Notifications.scheduleNotificationAsync({
                    content: {
                      title: portal.name,
                      body: lastMessage,
                    },
                    trigger: null,
                  }).catch(error => {
                    console.error('Error scheduling notification:', error);
                  });
                  setNotificationState(prevState => ({
                    ...prevState,
                    notifiedIds: new Set([...prevState.notifiedIds, lastMessageId]),
                  }));
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

              const formattedGroups: ChatGroup[] = updatedPortals.map((portal: any) => ({
                id: portal.id,
                name: portal.name,
                token: portal.channel,
                lastMessage: portal.lastMessage || 'No messages yet',
                time: portal.time || '',
                isNewMessage: portal.isNewMessage || false,
                lastMessageId: portal.lastMessageId || ''
              }));
              setChatState(prevState => ({
                ...prevState,
                groups: formattedGroups,
                lastMessageIds: formattedGroups.reduce((acc, group) => {
                  if (group.lastMessageId) {
                    acc[group.token] = group.lastMessageId;
                  }
                  return acc;
                }, {} as Record<string, string>),
              }));
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

  }, [notificationState.permission, notificationState.notifiedIds]);

  // Add notification listener setup
  useEffect(() => {
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { channel: string };
      if (data?.channel) {
        handleChatPress(data.channel);
      }
    });

    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      // Handle foreground notifications
      const data = notification.request.content.data as { channel: string };
      fetchSavedPortals(); // Refresh messages when notification received
    });

    return () => {
      backgroundSubscription.remove();
      foregroundSubscription.remove();
    };
  }, []);

  // Modify fetchSavedPortals to handle notifications better
  const fetchSavedPortals = async () => {
    try {
      const userSessionData = await AsyncStorage.getItem('userSession');
      if (userSessionData) {
        const userData = JSON.parse(userSessionData);
        setUserState(prevState => ({
          ...prevState,
          firstName: userData.user.first_name,
        }));
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

            const allPortals = Array.isArray(data.accounts) ? data.accounts : [data.accounts];
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

              if (notificationState.permission && lastMessageId && isNewMessage) {
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: portal.name,
                    body: lastMessage,
                    data: { channel: portal.channel },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    autoDismiss: false,
                  },
                  trigger: null,
                });
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

            const formattedGroups: ChatGroup[] = updatedPortals.map((portal: any) => ({
              id: portal.id,
              name: portal.name,
              token: portal.channel,
              lastMessage: portal.lastMessage || 'No messages yet',
              time: portal.time || '',
              isNewMessage: portal.isNewMessage || false,
              lastMessageId: portal.lastMessageId || ''
            }));
            setChatState(prevState => ({
              ...prevState,
              groups: formattedGroups,
              lastMessageIds: formattedGroups.reduce((acc, group) => {
                if (group.lastMessageId) {
                  acc[group.token] = group.lastMessageId;
                }
                return acc;
              }, {} as Record<string, string>),
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching saved portals:', error);
    }
  };

  // Navigates to account management screen
  const navigateToAccount = () => {
    setUserState(prevState => ({
      ...prevState,
      menuVisible: false,
    }));
    router.push('/accountManager');
  };

  // Navigates to profile management screen
  const navigateProfile = () => {
    setUserState(prevState => ({
      ...prevState,
      menuVisible: false,
    }));
    router.push('/profileManagement');
  };

  // Toggles the side menu visibility
  const toggleMenu = () => {
    setUserState(prevState => ({
      ...prevState,
      menuVisible: !prevState.menuVisible,
    }));
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
        setChatState(prevState => ({
          ...prevState,
          groups: prevState.groups.map(group => {
            if (group.token === token) {
              return { ...group, isNewMessage: false };
            }
            return group;
          }),
        }));
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
        firstName={userState.firstName}
        toggleMenu={toggleMenu}
        searchQuery={userState.searchQuery}
        setSearchQuery={(query: string) => setUserState(prevState => ({ ...prevState, searchQuery: query }))}
        unreadMessages={chatState.unreadCount}
        onNotificationPress={handleNotificationPress}
      />
      {chatState.showNotifications && (
        <>
          <TouchableOpacity
            className="absolute inset-0 z-40"
            onPress={() => setChatState(prevState => ({ ...prevState, showNotifications: false }))}
            activeOpacity={1}
          />
          <View className="absolute top-[80] right-4 w-[300] bg-white rounded-lg shadow-lg z-50 max-h-[400] overflow-hidden">
            <View className="p-3 border-b border-gray-200">
              <Text className="font-bold text-lg">Notifications</Text>
            </View>
            <ScrollView className="max-h-[350]">
              {chatState.unreadMessages.length > 0 ? (
                chatState.unreadMessages.map(message => (
                  <TouchableOpacity
                    key={message.id}
                    className="p-4 border-b border-gray-100"
                    onPress={() => {
                      handleChatPress(message.token);
                      setChatState(prevState => ({ ...prevState, showNotifications: false }));
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
        activeTab={userState.activeTab}
        setActiveTab={(tab: string) => setUserState(prevState => ({ ...prevState, activeTab: tab }))}
        showComingSoonAlert={showComingSoonAlert}
      />
      {userState.activeTab === 'Chats' ? (
        <ChatList
          chatGroups={chatState.groups}
          handleChatPress={handleChatPress}
        />
      ) : userState.activeTab === 'Contacts' ? (
        <ContactLists />
      ) : null}
      <View className="items-center pb-3">
        <Text className="text-black/70 text-sm">Powered by ICTD</Text>
      </View>
      {userState.menuVisible && (
        <>
          <TouchableOpacity
            className="absolute inset-0 bg-black/60 z-50"
            onPress={toggleMenu}
            activeOpacity={1}
          />
          <View className="absolute bottom-0 left-0 bg-white w-[70%] h-full z-[1000] rounded-tr-3xl">
            <LinearGradient colors={['#6B21A8', '#3B0764']} className="p-4 items-center shadow-lg">
              <View className="items-center mb-2" >
                <View className="w-64 h-32 rounded-xl overflow-hidden">
                  <Image
                    source={require('../assets/logo/ls_chat4.png')}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              </View>
            </LinearGradient>

            <View className="px-2 mt-4">
              <TouchableOpacity
                className="flex-row items-center p-4 mb-2 rounded-2xl hover:bg-gray-50 active:bg-gray-100"
                onPress={navigateProfile}
              >
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <Icon name="account-circle" size={24} color="#6B21A8" />
                </View>
                <Text className="ml-4 text-base font-semibold text-gray-800">Profile Management</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 mb-2 rounded-2xl hover:bg-gray-50 active:bg-gray-100"
                onPress={navigateToAccount}
              >
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <Icon name="list" size={24} color="#6B21A8" />
                </View>
                <Text className="ml-4 text-base font-semibold text-gray-800">Account Manager</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center p-5 mt-auto bg-red-50 active:bg-red-100"
              onPress={handleLogout}
            >
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                <Icon name="logout" size={24} color="#6B21A8" />
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



