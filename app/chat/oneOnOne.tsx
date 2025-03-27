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
      {new Date(item.created_at).toLocaleTimeString()}
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
    initializePubNub();
    return () => {
      if (pubnub) {
        pubnub.removeAllListeners();
        if (contact?.pubnub_channel) {
          pubnub.unsubscribe({
            channels: [contact.pubnub_channel],
          });
        }
      }
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

  React.useEffect(() => {
    if (!pubnub || !contact?.pubnub_channel) return;

    const listener = {
      message: (m: MessageEvent) => {
        const parsedMessage =
          typeof m.message === 'string' ? { text: m.message } : m.message;

        const newMessage: Message = {
          id: String(m.timetoken),
          sender_id: m.publisher || 'unknown',
          message: parsedMessage.text || '',
          created_at: new Date(m.timetoken / 10000).toISOString(),
        };

        setMessages(prev => [newMessage, ...prev]);
        // Only scroll to bottom if we were already at the bottom
        if (isAtBottom) {
          setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
        }
      },
    };

    pubnub.addListener(listener);
    pubnub.subscribe({
      channels: [contact.pubnub_channel],
      withPresence: true,
    });

    pubnub.fetchMessages(
      {
        channels: [contact.pubnub_channel],
        count: 20,
      },
      (_status, response: PubNubFetchMessagesResponse | null) => {
        if (response?.channels?.[contact.pubnub_channel]) {
          const historyMessages = response.channels[contact.pubnub_channel]
            .map((msg: FetchedMessage) => {
              const parsedMessage =
                typeof msg.message === 'string' ? { text: msg.message } : msg.message;

              return {
                id: String(msg.timetoken),
                sender_id: msg.uuid || 'unknown',
                message: parsedMessage.text || '',
                created_at: new Date(msg.timetoken / 10000).toISOString(),
              };
            })
            .reverse(); // Reverse the order for inverted list
          setMessages(historyMessages);
        }
      }
    );

    return () => {
      pubnub.removeListener(listener);
    };
  }, [pubnub, contact?.pubnub_channel, isAtBottom]);

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !pubnub || !contact?.pubnub_channel) return;

    try {
      await pubnub.publish({
        channel: contact.pubnub_channel,
        message: {
          text: newMessage.trim(),
        },
      });

      setNewMessage('');
      // Always scroll to bottom when sending a message
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    } catch (error) {
      console.error('Error sending message:', error);
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
