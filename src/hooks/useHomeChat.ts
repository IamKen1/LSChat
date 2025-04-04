import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { API_BASE_URL } from '../../config';
import { router } from 'expo-router';

interface ChatGroup {
  id: string;
  name: string;
  token: string;
  lastMessage: string;
  time: string;
  isNewMessage: boolean;
  lastMessageId: string;
}

interface OneOnOneChat {
  id: string;
  name: string;
  contact_id: string;
  lastMessage: string;
  time: string;
  isNewMessage: boolean;
  lastMessageId: string;
  pubnub_channel?: string;
}

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
  oneOnOneChats: OneOnOneChat[];
  unreadMessages: UnreadMessage[];
  unreadCount: number;
  showNotifications: boolean;
}

export const useHomeChat = () => {
  const [chatState, setChatState] = useState<ChatState>({
    groups: [],
    oneOnOneChats: [],
    unreadMessages: [],
    unreadCount: 0,
    showNotifications: false,
  });
  
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [notifiedIds] = useState<Set<string>>(new Set());

  // Toggle notifications panel
  const toggleNotifications = () => {
    setChatState(prev => ({
      ...prev,
      showNotifications: !prev.showNotifications
    }));
  };

  // Get unread count across all chats
  const getUnreadCount = useCallback(async () => {
    let totalUnread = 0;
    
    // Count unread portal messages
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
  
    // Add unread one-on-one messages
    chatState.oneOnOneChats.forEach(chat => {
      if (chat.isNewMessage) totalUnread += 1;
    });
  
    return totalUnread;
  }, [chatState.groups, chatState.oneOnOneChats]);

  // Setup push notification permissions
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        setHasPermission(finalStatus === 'granted');
      } catch (error) {
        console.error('Error setting up notifications:', error);
        setHasPermission(false);
      }
    };

    setupNotifications();
  }, []);

  // Update unread count regularly
  useEffect(() => {
    const updateUnreadCount = async () => {
      const count = await getUnreadCount();
      setChatState(prev => ({ ...prev, unreadCount: count }));
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [getUnreadCount]);

  // Fetch unread messages when notification panel is opened
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!chatState.showNotifications) return;
      
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
      
      setChatState(prev => ({
        ...prev,
        unreadMessages: allUnreadMessages,
      }));
    };

    fetchUnreadMessages();
  }, [chatState.showNotifications, chatState.groups]);

  // Get user data and initialize userId
  useEffect(() => {
    const initUser = async () => {
      try {
        const sessionData = await AsyncStorage.getItem('userSession');
        if (sessionData) {
          const userData = JSON.parse(sessionData);
          if (userData.user?.user_id) {
            setUserId(String(userData.user.user_id));
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };
    
    initUser();
  }, []);

  // Fetch group chats and one-on-one chats
  useEffect(() => {
    if (!userId) return;
    
    const fetchChats = async () => {
      await Promise.all([
        fetchGroupChats(),
        fetchOneOnOneChats()
      ]);
    };
    
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch group chats
  const fetchGroupChats = async () => {
    try {
      const userSessionData = await AsyncStorage.getItem('userSession');
      if (!userSessionData) return;
      
      const userData = JSON.parse(userSessionData);
      const response = await fetch(`${API_BASE_URL}/api/fetchAccounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.user_id
        }),
      });

      if (!response.ok) return;
      
      const data = await response.json();
      if (!data.success) return;

      const allPortals = Array.isArray(data.accounts) ? data.accounts : [data.accounts];
      const savedPortals = allPortals.filter((portal: any) => portal.status === 'active');

      // Fetch messages for each portal
      const messagePromises = savedPortals.map((portal: any) =>
        fetch(`${API_BASE_URL}/api/messages/${portal.channel}`)
          .then(res => res.json())
          .catch(() => [])
      );

      const allMessages = await Promise.all(messagePromises);
      
      // Process each portal with its messages
      const updatedPortals = savedPortals.map((portal: any, index: number) => {
        const messageData = allMessages[index];
        const lastMessage = messageData.length > 0 ? messageData[messageData.length - 1].message : 'No messages yet';
        const lastMessageTime = messageData.length > 0 ? messageData[messageData.length - 1].created_at : '';
        const lastMessageId = messageData.length > 0 ? messageData[messageData.length - 1].id : null;
        const unreadCount = messageData.filter((msg: any) => msg.is_read === 0).length;
        const isNewMessage = unreadCount > 0;

        // Show notification if needed
        if (hasPermission && lastMessageId && isNewMessage && !notifiedIds.has(lastMessageId)) {
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
          notifiedIds.add(lastMessageId);
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

      setChatState(prev => ({
        ...prev,
        groups: formattedGroups,
      }));
    } catch (error) {
      console.error('Error fetching group chats:', error);
    }
  };

  // Fetch one-on-one chats
  const fetchOneOnOneChats = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/fetch-contact-lists?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');

      const contacts = await response.json();
      const filteredContacts = contacts.filter((contact: any) => 
        String(contact.contact_id) !== userId
      );

      const messagePromises = filteredContacts.map(async (contact: any) => {
        try {
          const messagesResponse = await fetch(`${API_BASE_URL}/api/chatMessages/${contact.pubnub_channel}`);
          if (!messagesResponse.ok) return null;

          const messages = await messagesResponse.json();
          if (messages.length === 0) return null;

          // Filter messages involving the current user
          const validMessages = messages.filter((msg: any) => 
            String(msg.user_id) === userId || String(msg.user_id) === String(contact.contact_id)
          );

          if (validMessages.length === 0) return null;

          const lastMessage = validMessages[validMessages.length - 1];
          const uniqueId = `${contact.pubnub_channel}_${contact.contact_id}`;

          // Check for unread messages from the contact
          const hasUnreadMessages = validMessages.some(
            (msg: any) => 
              (msg.is_read === 0 || !msg.is_read) && 
              String(msg.user_id) === String(contact.contact_id)
          );

          return {
            id: uniqueId,
            name: contact.contact_full_name,
            contact_id: String(contact.contact_id),
            pubnub_channel: contact.pubnub_channel,
            lastMessage: lastMessage.message_content,
            time: new Date(lastMessage.created_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
              timeZone: 'UTC',
            }),
            isNewMessage: hasUnreadMessages,
            lastMessageId: String(lastMessage.message_id)
          };
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(messagePromises);
      const validChats = results.filter((chat): chat is OneOnOneChat => 
        chat !== null && chat.lastMessage !== null
      );

      setChatState(prev => ({
        ...prev,
        oneOnOneChats: validChats,
      }));
    } catch (error) {
      console.error('Error fetching one-on-one messages:', error);
    }
  };

  // Handle group chat press
  const handleGroupChatPress = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/update/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        setChatState(prev => ({
          ...prev,
          groups: prev.groups.map(group => 
            group.token === token ? { ...group, isNewMessage: false } : group
          ),
          showNotifications: false
        }));
      }

      router.push({
        pathname: "/chat/[token]",
        params: { token }
      });
    } catch (error) {
      console.error('Error handling group chat press:', error);
      // Navigate anyway
      router.push({
        pathname: "/chat/[token]",
        params: { token }
      });
    }
  };

  // Handle one-on-one chat press
  const handleOneOnOneChatPress = async (contactId: string) => {
    try {
      // Find the chat to get the PubNub channel
      const chat = chatState.oneOnOneChats.find(c => c.contact_id === contactId);
      if (chat?.pubnub_channel) {
        const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
        if (userData.user) {
          // Mark messages as read
          await fetch(`${API_BASE_URL}/api/update-chat-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: chat.pubnub_channel,
              user_id: userData.user.user_id
            }),
          });

          // Update local state
          setChatState(prev => ({
            ...prev,
            oneOnOneChats: prev.oneOnOneChats.map(c => 
              c.contact_id === contactId ? { ...c, isNewMessage: false } : c
            ),
            showNotifications: false
          }));
        }
      }

      // Navigate to chat
      router.push({
        pathname: "/chat/oneOnOne",
        params: { contactId }
      });
    } catch (error) {
      console.error('Error handling one-on-one chat press:', error);
      // Navigate anyway
      router.push({
        pathname: "/chat/oneOnOne",
        params: { contactId }
      });
    }
  };

  return {
    chatState,
    toggleNotifications,
    handleGroupChatPress,
    handleOneOnOneChatPress,
    refreshData: fetchGroupChats
  };
};

export default useHomeChat;
