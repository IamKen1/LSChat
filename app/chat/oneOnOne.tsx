import React from 'react';
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Text, AppState, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PubNub from 'pubnub';
import { API_BASE_URL, PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } from '../../config';
import { showLocalNotification } from '../../src/notifications/useNotification';
import * as DocumentPicker from 'expo-document-picker';
import { FlashList } from '@shopify/flash-list';

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
    const [date] = dateString.split('T');
    const timeWithMs = dateString.split('T')[1];
    const [time] = timeWithMs.split('.');
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const hour12 = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    return '';
  }
};

const MessageItem: React.FC<MessageItemProps> = React.memo(({ item, contactId }) => {
  const isImageUrl = (url: string) => /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(url);

  const renderMessageContent = (message: string) => {
    const parts = message.split(/\[(?:Image|File): (.+?)\]/);
    return parts.map((part, index) => {
      if (isImageUrl(part)) {
        return (
          <Image
            key={index}
            source={{ uri: part }}
            className="w-full h-40 rounded-lg mt-2"
            resizeMode="cover"
          />
        );
      }
      return (
        <Text
          key={index}
          className={`text-sm ${item.sender_id === contactId ? 'text-white' : 'text-black'} ${
            index > 0 ? 'mt-2' : ''
          }`}
        >
          {part.trim()}
        </Text>
      );
    });
  };

  return (
    <View
      className={`p-3 m-2 w-64 rounded-lg ${
        item.sender_id === contactId ? 'bg-[#6B21A8] self-start' : 'bg-gray-200 self-end'
      }`}
    >
      <Text className={`text-xs ${item.sender_id === contactId ? 'text-white' : 'text-gray-500'}`}>
        {item.sender_id === contactId ? 'Tanggol' : 'You'}
      </Text>
      {renderMessageContent(item.message)}
      <Text className={`text-xs ${item.sender_id === contactId ? 'text-white' : 'text-gray-500'} mt-1 text-right`}>
        {formatTime(item.created_at)}
      </Text>
    </View>
  );
});

export default function OneOnOneChat() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId: string }>();
  const contactId = params.contactId;
  
  const [contact, setContact] = React.useState<Contact | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [pubnub, setPubnub] = React.useState<PubNub | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [selectedFile, setSelectedFile] = React.useState<{ uri: string; name?: string; type?: string } | null>(null);
  const [inputContent, setInputContent] = React.useState<string>('');
  const [loadingMessages, setLoadingMessages] = React.useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = React.useState<boolean>(false);
  
  const flatListRef = React.useRef<FlashList<Message>>(null);
  const appState = React.useRef(AppState.currentState);
  const lastMessageIdRef = React.useRef<string | null>(null);
  const isScreenActiveRef = React.useRef<boolean>(true);
  const initialLoadRef = React.useRef(true);
  
  React.useEffect(() => {
    const getUserId = async () => {
      try {
        const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
        if (userData.user) {
          setUserId(String(userData.user.user_id));
        }
      } catch (error) {
        console.error('Error getting user ID:', error);
      }
    };
    getUserId();
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    isScreenActiveRef.current = true;
    return () => {
      isScreenActiveRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (contactId) {
      fetchContactDetails();
    }
  }, [contactId]);

  React.useEffect(() => {
    if (contact?.pubnub_channel) {
      initializePubNub();
      initialLoadRef.current = true;
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
  }, [contact]);

  React.useEffect(() => {
    if (!pubnub || !contact?.pubnub_channel || !contact?.name || !userId) return;

    const handleMessage = async () => {
      try {
        await fetchChatHistory(contact.pubnub_channel);
        
        if (!isScreenActiveRef.current || appState.current !== 'active') {
          if (messages.length > 0) {
            const latestMessage = messages[0];
            
            if (latestMessage.sender_id === contactId) {
              await showLocalNotification(
                contact.name,
                latestMessage.message,
                { contactId, screen: 'oneOnOne' }
              );
            }
          }
        }
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    };

    pubnub.addListener({ message: handleMessage });
    pubnub.subscribe({
      channels: [contact.pubnub_channel],
      withPresence: false
    });

    return () => {
      pubnub.removeListener({ message: handleMessage });
    };
  }, [pubnub, contact?.pubnub_channel, contact?.name, userId]);

  const initializePubNub = async () => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) return;

      const pubnubInstance = new PubNub({
        publishKey: PUBNUB_PUBLISH_KEY,
        subscribeKey: PUBNUB_SUBSCRIBE_KEY,
        userId: String(userData.user.user_id),
      });

      setPubnub(pubnubInstance);
    } catch (error) {
      console.error('Error initializing PubNub:', error);
    }
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

  const markMessagesAsRead = async (token: string) => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) return;
      
      const hasUnreadFromContact = messages.some(msg => 
        msg.sender_id === contactId &&
        msg.sender_id !== userData.user.user_id
      );
      
      if (hasUnreadFromContact) {
        await fetch(`${API_BASE_URL}/api/update-chat-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            user_id: userData.user.user_id
          }),
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchChatHistory = async (token: string): Promise<boolean> => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatMessages/${token}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching chat history:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const mappedMessages: Message[] = data.map((item: any) => ({
        id: String(item.message_id),
        sender_id: String(item.user_id),
        message: item.message_content,
        created_at: item.created_at,
        is_read: item.is_read,
      }));

      const reversed = mappedMessages.reverse();

      const hasNewMessages =
        reversed.length > 0 &&
        (lastMessageIdRef.current === null || reversed[0].id !== lastMessageIdRef.current);

      if (reversed.length > 0) {
        lastMessageIdRef.current = reversed[0].id;
      }

      setMessages(reversed);

      // Mark messages as read only if screen is active and not first load
      if (!initialLoadRef.current && userId && isScreenActiveRef.current) {
        await markMessagesAsRead(token);
      }

      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }

      return hasNewMessages;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return false;
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    // Validate input - must have either text or a file
    if (!inputContent.trim() && !selectedFile) return; 
    
    // Make sure we're connected
    if (!pubnub || !contact?.pubnub_channel) {
      Alert.alert('Error', 'Connection not initialized. Please try again.');
      return;
    }
  
    // Set sending state
    setSendingMessage(true);
    
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) throw new Error('User session not found');
  
      // Create form data
      const formData = new FormData();
      formData.append('user_id', userData.user.user_id);
      formData.append('token', contact.pubnub_channel);
  
      // Add file if selected
      if (selectedFile) {
        formData.append('file', {
          uri: selectedFile.uri,
          type: selectedFile.type || 'application/octet-stream',
          name: selectedFile.name || selectedFile.uri.split('/').pop() || 'file'
        } as any);
      }
  
      // Add text content if any
      if (inputContent.trim()) {
        formData.append('message_content', inputContent.trim());
      }
      
      // Send the message to the server
      const response = await fetch(`${API_BASE_URL}/api/sendMessage`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error('Server error: ' + (errorText || response.statusText));
      }
      
      // Notify via PubNub
      await pubnub.publish({
        channel: contact.pubnub_channel,
        message: {
          type: 'NEW_MESSAGE',
          timestamp: Date.now(),
        },
      });
  
      // Clear input fields
      setInputContent('');
      setSelectedFile(null);
      
      // Refresh the message list
      await fetchChatHistory(contact.pubnub_channel);
      
      // Scroll to bottom if we were at bottom
      if (isAtBottom) {
        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      // Always reset sending state when done
      setSendingMessage(false);
    }
  };
  
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: '*/*', 
        copyToCacheDirectory: false
      });
  
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.uri) {
          setSelectedFile({ uri: file.uri, name: file.name, type: file.mimeType });
        } else {
          Alert.alert('Error', 'Failed to select a file. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'An error occurred while selecting a file.');
    }
  };

  const handleScroll = (event: any) => {
    setIsAtBottom(event.nativeEvent.contentOffset.y > -20);
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
            <Text className="text-white text-sm mt-1">{contact?.phone}</Text>
          </View>
        </LinearGradient>

        {loadingMessages ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6B21A8" />
          </View>
        ) : (
          <View className="flex-1">
            <FlashList
              ref={flatListRef}
              data={messages}
              estimatedItemSize={100}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <MessageItem item={item} contactId={contactId} />}
              contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 10 }}
              inverted={true}
              onScroll={handleScroll}
              onScrollBeginDrag={() => setIsAtBottom(false)}
              viewabilityConfig={{
                viewAreaCoveragePercentThreshold: 50,
              }}
              estimatedListSize={{
                width: 350,
                height: 500
              }}
            />
          </View>
        )}

        <View className="flex-row items-center p-4 border-t border-gray-200">
          <TouchableOpacity className="mr-2" onPress={pickFile}>
            <Ionicons name="attach" size={24} color="#6B21A8" />
          </TouchableOpacity>
          <View className="flex-1 bg-gray-100 p-3 rounded-full flex-row items-center">
            {selectedFile && (
              <View className="flex-row items-center mr-3">
                {selectedFile.type?.startsWith('image/') ? (
                  <Image
                    source={{ uri: selectedFile.uri }}
                    className="w-10 h-10 rounded-full mr-2"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="document" size={24} color="#6B21A8" className="mr-2" />
                )}
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <Ionicons name="close-circle" size={20} color="#6B21A8" />
                </TouchableOpacity>
              </View>
            )}
            <TextInput
              className="flex-1 text-base"
              placeholder="Type a message..."
              value={inputContent}
              onChangeText={setInputContent}
              multiline={true}
              returnKeyType="send"
              blurOnSubmit={true}
            />
          </View>
          <TouchableOpacity 
            onPress={sendMessage} 
            className="ml-3 p-2"
            disabled={sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#6B21A8" />
            ) : (
              <Ionicons 
                name="send" 
                size={24} 
                color={(inputContent.trim() || selectedFile) ? '#6B21A8' : '#CBD5E0'} 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
