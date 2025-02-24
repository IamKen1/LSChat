import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Clipboard, ToastAndroid, Platform, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PubNub from 'pubnub';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import debounce from 'lodash/debounce';
import { API_BASE_URL } from '../../config';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

const MessageItem = React.memo(({ item, copyToClipboard, formatTimestamp }: { item: { sender: string; text: string; timestamp: string }; copyToClipboard: (text: string) => void; formatTimestamp: (timestamp: string) => string }) => (
  <TouchableOpacity 
    onLongPress={() => copyToClipboard(item.text)}
    delayLongPress={500}
  >
    <View className="mb-4">
      <View className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
        item.sender === 'user' 
          ? 'self-end bg-[#007AFF] rounded-br-sm' 
          : 'self-start bg-white rounded-bl-sm'
      }`}>
        <Text className={`text-base leading-5 ${
          item.sender === 'user' ? 'text-white' : 'text-black'
        }`}>
          {item.text}
        </Text>
      </View>
      <Text className={`text-xs mt-1 text-[#666666] ${
        item.sender === 'user' ? 'self-end mr-1' : 'self-start ml-1'
      }`}>
        {formatTimestamp(item.timestamp)}
      </Text>
    </View>
  </TouchableOpacity>
));

const ChatScreen = () => {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [portalName, setPortalName] = useState('');
  const [pubnub, setPubnub] = useState<PubNub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const messageCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageTimestamp = useRef('');
  const shouldScrollToBottom = useRef(true);

  const debouncedFetchMessages = useCallback(
    debounce(async () => {
      if (!token) return;
      await fetchMessages();
    }, 1000),
    [token]
  );

  const fetchMessages = async () => {
    if (isLoadingMore) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${API_BASE_URL}/api/messages/${token}?page=${page}`, 
        {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      if (!Array.isArray(data)) return;

      const latestMessage = data[data.length - 1];
      const latestTimestamp = latestMessage?.created_at || '';

      if (latestTimestamp !== lastMessageTimestamp.current) {
        lastMessageTimestamp.current = latestTimestamp;
        const formattedMessages = data.map(({ id, message, created_at }) => ({
          id,
          text: message || '',
          sender: 'other',
          timestamp: created_at || new Date().toISOString()
        }));

        setMessages(prev => {
          const allMessages = page === 1 ? formattedMessages : [...prev, ...formattedMessages];
          return allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
        
        if (scrollViewRef.current && shouldScrollToBottom.current) {
          requestAnimationFrame(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const initializePubNub = async () => {
        const userSessionData = await AsyncStorage.getItem('userSession');
        if (userSessionData) {
          const userData = JSON.parse(userSessionData);
          const newPubnub = new PubNub({
            publishKey: "pub-c-1be65bd7-a79f-4a2f-bd44-94122258c5fd",
            subscribeKey: "sub-c-a4830e4f-471e-4218-867c-6aa54f0cfade",
            uuid: userData.user.username,
            heartbeatInterval: 10
          });
          setPubnub(newPubnub);
        }
      };

      initializePubNub();
      debouncedFetchMessages();
      messageCheckInterval.current = setInterval(debouncedFetchMessages, 10000);

      return () => {
        if (messageCheckInterval.current) {
          clearInterval(messageCheckInterval.current);
          messageCheckInterval.current = null;
        }
        if (pubnub) {
          pubnub.unsubscribe({ channels: [token as string] });
          pubnub.removeAllListeners();
          pubnub.stop();
          setPubnub(null);
        }
        debouncedFetchMessages.cancel();
      };
    }, [])
  );

useEffect(() => {
  const fetchPortalName = async () => {
    try {
      const userSessionData = await AsyncStorage.getItem('userSession');
      if (!userSessionData) return;

      const { user: { user_id } } = JSON.parse(userSessionData);
      const response = await fetch(`${API_BASE_URL}/api/fetchAccounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ user_id })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      if (!data.success) return;

      const currentPortal = data.accounts.find((account: { channel: string | string[]; }) => account.channel === token);
      if (currentPortal) {
        setPortalName(currentPortal.name);
      }
    } catch (error) {
      console.error('Error fetching portal name:', error);
    }
  };

  fetchPortalName();
}, [token]);

  useEffect(() => {
    if (pubnub) {
      pubnub.subscribe({
        channels: [token as string],
        withPresence: true
      });

      pubnub.addListener({
        message: async (msg: { message: { toString: () => any; }; }) => {
          const newMessage = {
            id: Date.now() + Math.random(),
            text: msg.message.toString(),
            sender: 'other',
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => {
            const updatedMessages = [...prev, newMessage];
            return updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          });
          
          if (shouldScrollToBottom.current) {
            requestAnimationFrame(() => {
              scrollViewRef.current?.scrollToEnd();
            });
          }

          await Notifications.scheduleNotificationAsync({
            content: {
              title: portalName,
              body: msg.message.toString(),
            },
            trigger: null,
          });
        }
      });
    }
  }, [pubnub, token, portalName]);

  const loadMoreMessages = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setPage(prev => prev + 1);
    await debouncedFetchMessages();
  };

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'UTC',
    });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    Clipboard.setString(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Message copied to clipboard', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied', 'Message copied to clipboard');
    }
  }, []);

  const handleScroll = useCallback(({ nativeEvent }: { nativeEvent: any }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    shouldScrollToBottom.current = 
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    
    if (contentOffset.y <= 0) {
      loadMoreMessages();
    }
  }, []);

  useEffect(() => {
    if (!isLoading && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isLoading]);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <View className="flex-row items-start p-4 border-b border-[#E5E5E5] bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#4c669f" />
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1 text-center ml-4">{portalName}</Text>
        <View className="w-6" />
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 p-4"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {isLoadingMore && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
          {messages.map((item) => (
            <MessageItem 
              key={item.id.toString()}
              item={item}
              copyToClipboard={copyToClipboard}
              formatTimestamp={formatTimestamp}
            />
          ))}
        </ScrollView>
      )}

      <View className="flex-row p-4 border-t border-[#E5E5E5] bg-white">
        <TextInput
          className="flex-1 bg-[#E0E0E0] rounded-full px-4 py-2 mr-2 text-base"
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          multiline
          editable={false}
        />
        <TouchableOpacity 
          className="w-11 h-11 bg-[#CCCCCC] rounded-full justify-center items-center" 
          disabled={true}
        >
          <Icon name="send" size={24} color="#888888" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};export default React.memo(ChatScreen);