import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PubNub from 'pubnub';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } from '../../config';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface PubNubMessagePayload {
  message_id?: string;
  group_id?: string;
  sender_id?: string;
  sender_name?: string;
  message?: string;
  message_content?: string;
  created_at?: string;
}

const GroupChat = () => {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pubnub, setPubnub] = useState<PubNub | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializePubNub = async () => {
      try {
        const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
        if (!userData.user) return;

        const userId = String(userData.user.user_id);
        setCurrentUserId(userId);

        const pubnubInstance = new PubNub({
          publishKey: PUBNUB_PUBLISH_KEY,
          subscribeKey: PUBNUB_SUBSCRIBE_KEY,
          userId: userId
        });
        setPubnub(pubnubInstance);

        pubnubInstance.addListener({
          message: (event) => {
            try {
              const rawPayload = event.message as unknown;
              if (rawPayload && typeof rawPayload === 'object') {
                const payload = rawPayload as PubNubMessagePayload;
                if (payload.group_id === groupId) {
                  const typedMessage: Message = {
                    id: payload.message_id || `temp-${Date.now()}`,
                    sender_id: payload.sender_id || "unknown",
                    sender_name: payload.sender_name || "Unknown",
                    message: payload.message || payload.message_content || "",
                    created_at: payload.created_at || new Date().toISOString(),
                  };
                  setMessages((prevMessages) => [typedMessage, ...prevMessages]);
                }
              }
            } catch (error) {
              console.error('Error processing PubNub message:', error);
            }
          }
        });

        pubnubInstance.subscribe({ channels: [`group-${groupId}`] });
      } catch (error) {
        console.error('Error initializing PubNub:', error);
      }
    };

    initializePubNub();
    return () => pubnub?.unsubscribeAll();
  }, [groupId]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/groupMessages/${groupId}`);
        const data = await response.json();
        if (response.ok) {
          // Ensure sender_id is always a string in the messages
          const formattedMessages = data.map((msg: any) => ({
            ...msg,
            sender_id: String(msg.sender_id)
          }));
          setMessages(formattedMessages.reverse());
        }
      } catch (error) {
        console.error('Error fetching group messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [groupId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) return;
      
      const requestBody = {
        group_id: Number(groupId),
        sender_id: Number(userData.user.user_id),
        message_content: newMessage.trim()
      };

      const response = await fetch(`${API_BASE_URL}/api/sendGroupMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.success && pubnub) {
        const messagePayload = {
          message_id: String(data.message_id),
          group_id: String(groupId),
          sender_id: String(userData.user.user_id),
          sender_name: data.sender_name || userData.user.first_name,
          message_content: newMessage.trim(),
          created_at: new Date().toISOString(),
        };
        
        await pubnub.publish({
          channel: `group-${groupId}`,
          message: messagePayload,
        });
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMenuOption = (option: string) => {
    if (option === 'members') {
      router.push({
        pathname: '/groups/members',
        params: { groupId },
      });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Convert both IDs to strings for consistent comparison
    const isCurrentUser = String(item.sender_id) === String(currentUserId);
    
    return (
      <View
        className={`p-3 m-2 w-64 rounded-lg ${
          isCurrentUser ? 'bg-[#6B21A8] self-end' : 'bg-gray-200 self-start'
        }`}
      >
        <Text className={`text-xs ${isCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>{item.sender_name}</Text>
        <Text className={`text-sm ${isCurrentUser ? 'text-white' : 'text-black'}`}>
          {item.message}
        </Text>
        <Text className={`text-xs ${isCurrentUser ? 'text-white/70' : 'text-gray-400'} mt-1 text-right`}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-[#6B21A8] p-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-2">{groupName}</Text>
        <View className="flex-1" />
        <Menu>
          <MenuTrigger customStyles={{
            triggerWrapper: {
              padding: 8,
              borderRadius: 20,
            },
            triggerTouchable: {
              activeOpacity: 0.7,
            }
          }}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </MenuTrigger>
          
          <MenuOptions customStyles={{
            optionsContainer: {
              borderRadius: 12,
              padding: 6,
              width: 220,
              backgroundColor: 'white',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
            optionWrapper: {
              padding: 8,
            }
          }}>
            <MenuOption onSelect={() => handleMenuOption('members')}>
              <View className="flex-row items-center py-3 px-2">
                <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center">
                  <Ionicons name="people" size={18} color="#6B21A8" />
                </View>
                <Text className="text-gray-800 font-medium ml-3">View Members</Text>
              </View>
            </MenuOption>
            
            <View className="border-t border-gray-100 my-1" />
            
            <MenuOption onSelect={() => Alert.alert('Coming Soon', 'This feature will be available soon!')}>
              <View className="flex-row items-center py-3 px-2">
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="information-circle" size={18} color="#3B82F6" />
                </View>
                <Text className="text-gray-800 font-medium ml-3">Group Info</Text>
              </View>
            </MenuOption>
            
            <View className="border-t border-gray-100 my-1" />
            
            <MenuOption onSelect={() => Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Leave', style: 'destructive', onPress: () => router.back() }
            ])}>
              <View className="flex-row items-center py-3 px-2">
                <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                  <Ionicons name="exit-outline" size={18} color="#EF4444" />
                </View>
                <Text className="text-red-500 font-medium ml-3">Leave Group</Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
      
      {loadingMessages ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6B21A8" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
          inverted
        />
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-row items-center p-4 border-t border-gray-200"
      >
        <TextInput
          className="flex-1 bg-gray-100 p-3 rounded-full"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          className="ml-3 p-2"
          disabled={sendingMessage}
        >
          {sendingMessage ? (
            <ActivityIndicator size="small" color="#6B21A8" />
          ) : (
            <Ionicons name="send" size={24} color={newMessage.trim() ? '#6B21A8' : '#CBD5E0'} />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default GroupChat;
