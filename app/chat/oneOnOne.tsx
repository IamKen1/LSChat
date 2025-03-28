import React from 'react';
import { View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Text,NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PubNub from 'pubnub';
import type { MessageEvent, FetchedMessage, FetchMessagesResponse as PubNubFetchMessagesResponse } from 'pubnub';
import { API_BASE_URL, PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } from '../../config';

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  pubnub_channel: string;
}

interface MessageItemProps {
  item: Message;
  contactId: string | null;
}

const formatTime = (dateString: string | undefined) => {
  try {
    if (!dateString) return '';

    // Extract date and time parts
    const [date] = dateString.split('T');
    const timeWithMs = dateString.split('T')[1];
    const [time] = timeWithMs.split('.');
    const [hours, minutes] = time.split(':');

    // Convert to 12-hour format
    const hour = parseInt(hours);
    const hour12 = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';

    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    console.log('Date string:', dateString);
    console.error('Error formatting time:', error);
    return '';
  }
};

const MessageItem: React.FC<MessageItemProps> = React.memo(({ item, contactId }) => (
  <View
    className={`p-3 m-2 w-64 rounded-lg ${
      item.sender_id === contactId ? 'bg-[#6B21A8] self-start' : 'bg-gray-200 self-end'
    }`}
  >
    <Text className={`text-xs ${item.sender_id === contactId ? 'text-white' : 'text-gray-500'}`}>
      {item.sender_id === contactId ? 'Tanggol' : 'You'}
    </Text>
    <Text className={`text-sm ${item.sender_id === contactId ? 'text-white' : 'text-black'}`}>
      {item.message}
    </Text>
    <Text className={`text-xs ${item.sender_id === contactId ? 'text-white' : 'text-gray-500'} mt-1 text-right`}>
      {formatTime(item.created_at)}
    </Text>
  </View>
));

export default function OneOnOneChat() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId: string }>();
  const contactId = params.contactId;
  const [contact, setContact] = React.useState<Contact | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const flatListRef = React.useRef<FlatList<Message>>(null);
  const [pubnub, setPubnub] = React.useState<PubNub | null>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    // Check if we're at or very close to the bottom (within 20px)
    setIsAtBottom(offset > -20);
  };

  React.useEffect(() => {
    if (contactId) {
      fetchContactDetails();
    }
  }, [contactId]);

  React.useEffect(() => {
    // Initialize PubNub when contact is loaded
    if (contact?.pubnub_channel) {
      initializePubNub();
      // Initial fetch of messages
      fetchChatHistory(contact.pubnub_channel);
    }
    
    return () => {
      if (pubnub) {
        pubnub.removeAllListeners();
        pubnub.unsubscribe({
          channels: [contact?.pubnub_channel || ''],
        });
      }
    };
  }, [contact]); // Only re-run when contact changes

  // Separate effect for PubNub listener
  React.useEffect(() => {
    if (!pubnub || !contact?.pubnub_channel) return;

    console.log('Setting up PubNub listener for channel:', contact.pubnub_channel);

    const handleMessage = async () => {
      console.log('New message received, fetching updates...');
      try {
        await fetchChatHistory(contact.pubnub_channel);
      } catch (error) {
        console.error('Error fetching messages after PubNub notification:', error);
      }
    };

    const listener = {
      message: handleMessage
    };

    pubnub.addListener(listener);
    pubnub.subscribe({
      channels: [contact.pubnub_channel],
      withPresence: false
    });

    console.log('PubNub subscription active');

    return () => {
      console.log('Cleaning up PubNub listener');
      pubnub.removeListener(listener);
    };
  }, [pubnub, contact?.pubnub_channel]);

  const initializePubNub = async () => {
    const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
    if (!userData.user) return;

    const pubnubInstance = new PubNub({
      publishKey: PUBNUB_PUBLISH_KEY,
      subscribeKey: PUBNUB_SUBSCRIBE_KEY,
      userId: String(userData.user.user_id),
    });

    setPubnub(pubnubInstance);
  };

  const fetchContactDetails = async () => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) return;

      const response = await fetch(`${API_BASE_URL}/api/fetch-contact-lists?user_id=${userData.user.user_id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const contactDetails = data.find((contact: any) => String(contact.contact_id) === contactId);

      if (contactDetails) {
        setContact({
          id: String(contactDetails.contact_id),
          name: contactDetails.contact_full_name,
          phone: contactDetails.contact_mobile_number,
          pubnub_channel: contactDetails.pubnub_channel,
        });
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
    }
  };

  const fetchChatHistory = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatMessages/${token}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const mappedMessages: Message[] = data.map((item: any) => ({
        id: String(item.message_id),
        sender_id: String(item.user_id),
        message: item.message_content,
        created_at: item.created_at,
      }));

      setMessages(mappedMessages.reverse());
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !pubnub || !contact?.pubnub_channel) return;

    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) throw new Error('User session not found');

      console.log('Sending message to database...');
      
      // 1. Save to database first
      const response = await fetch(`${API_BASE_URL}/api/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.user.user_id,
          message: newMessage.trim(),
          token: contact.pubnub_channel,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message to the server');
      }

      console.log('Message saved to database, triggering PubNub...');

      // 2. Trigger PubNub to notify other clients
      await pubnub.publish({
        channel: contact.pubnub_channel,
        message: {
          type: 'NEW_MESSAGE',
          timestamp: Date.now()
        }
      });

      // 3. Clear input
      setNewMessage('');

      // 4. Fetch latest messages locally
      await fetchChatHistory(contact.pubnub_channel);

      if (isAtBottom) {
        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <LinearGradient
          colors={['#6B21A8', '#3B0764']}
          className="p-4 flex-row items-center"
        >
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Text>
          </TouchableOpacity>
          <View className="ml-4 flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-xl font-bold">{contact?.name}</Text>
              <View className="flex-row pt-2">
                <TouchableOpacity className="px-2">
                  <Ionicons name="call" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity className="px-2">
                  <Ionicons name="videocam" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-white text-sm">{contact?.phone}</Text>
          </View>
        </LinearGradient>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageItem item={item} contactId={contactId} />}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', padding: 10 }}
          inverted={true}
          onScroll={handleScroll}
          onScrollBeginDrag={() => setIsAtBottom(false)}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={21}
        />

        <View className="flex-row items-center p-4 border-t border-gray-200">
          <TouchableOpacity className="mr-2">
            <Ionicons name="attach" size={24} color="#6B21A8" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-gray-100 p-3 rounded-full text-base"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            onKeyPress={handleKeyPress}
            multiline={false}
            returnKeyType="send"
            blurOnSubmit={true}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            className="ml-3 p-2"
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={newMessage.trim() ? '#6B21A8' : '#CBD5E0'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
