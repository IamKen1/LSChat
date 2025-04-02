import React from 'react';
import { View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Text, NativeSyntheticEvent, TextInputKeyPressEventData, AppState, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PubNub from 'pubnub';
import { API_BASE_URL, PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } from '../../config';
import { showLocalNotification } from '../../src/notifications/useNotification';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { FlashList } from '@shopify/flash-list';

// Types
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

// Format timestamp to readable time
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
    const [year, month, day] = date.split('-');
    return `${month}/${day}/${year} ${hour12}:${minutes} ${ampm}`;
  } catch (error) {
    return '';
  }
};
// Message bubble component
const MessageItem: React.FC<MessageItemProps> = React.memo(({ item, contactId }) => {
  const isImageUrl = (url: string) => /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(url);

  const renderMessageContent = (message: string) => {
    const parts = message.split(/\[(?:Image|File): (.+?)\]/); // Match both [Image: URL] and [File: URL]
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
  
  // States
  const [contact, setContact] = React.useState<Contact | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [pubnub, setPubnub] = React.useState<PubNub | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [selectedFile, setSelectedFile] = React.useState<{ uri: string; name?: string; type?: string } | null>(null);
  const [inputContent, setInputContent] = React.useState<string>(''); // For text input
  const [loadingMessages, setLoadingMessages] = React.useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = React.useState<boolean>(false);
  
  // Refs
  const flatListRef = React.useRef<FlashList<Message>>(null);
  const appState = React.useRef(AppState.currentState);
  const lastMessageIdRef = React.useRef<string | null>(null);
  const isScreenActiveRef = React.useRef<boolean>(true);
  
  // Get current user ID
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

  // Monitor app state
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // Track screen active state
  React.useEffect(() => {
    isScreenActiveRef.current = true;
    return () => {
      isScreenActiveRef.current = false;
    };
  }, []);

  // Fetch contact details
  React.useEffect(() => {
    if (contactId) {
      fetchContactDetails();
    }
  }, [contactId]);

  // Initialize PubNub
  React.useEffect(() => {
    if (contact?.pubnub_channel) {
      initializePubNub();
      // Set initialLoad to true before the first fetch
      initialLoadRef.current = true;
      fetchChatHistory(contact.pubnub_channel, { skipMarkRead: true });
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

  // PubNub message listener
  React.useEffect(() => {
    if (!pubnub || !contact?.pubnub_channel || !contact?.name || !userId) return;

    const handleMessage = async () => {
      try {
        // Now we need to check who sent the message before deciding to mark as read
        const currentMessages = [...messages];
        
        // Fetch latest messages
        await fetchChatHistory(contact.pubnub_channel, {
          // Only skip marking if screen is not active
          skipMarkRead: !isScreenActiveRef.current || appState.current !== 'active'
        });
        
        // Show notification if app/screen not active and message is from contact
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

  // Only mark messages from other users as read, check for new unread messages from other users
  const markMessagesAsRead = async (token: string) => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) return;
      
      // Check if there are any unread messages from the contact
      const hasUnreadFromContact = messages.some(msg => 
        msg.sender_id === contactId && // Message is from contact (not from us)
        msg.sender_id !== userData.user.user_id // Double check it's not our message
      );
      
      // Only make the API call if there are messages to mark as read
      if (hasUnreadFromContact) {
        console.log("Marking messages as read that are from contact:", contactId);
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

  // Track initial load to avoid marking on first render
  const initialLoadRef = React.useRef(true);

  // This now handles when to mark messages
  const fetchChatHistory = async (
    token: string,
    options: { skipMarkRead?: boolean; isAfterSend?: boolean } = {}
  ): Promise<boolean> => {
    setLoadingMessages(true);
    try {
      console.log('Fetching chat history for token:', token); // Debug log
      const response = await fetch(`${API_BASE_URL}/api/chatMessages/${token}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching chat history:', response.status, errorText); // Debug log
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

      // Check if we have new messages
      const hasNewMessages =
        reversed.length > 0 &&
        (lastMessageIdRef.current === null || reversed[0].id !== lastMessageIdRef.current);

      if (reversed.length > 0) {
        lastMessageIdRef.current = reversed[0].id;
      }

      setMessages(reversed);

      // Skip marking messages as read in these cases:
      if (
        !options.skipMarkRead &&
        !options.isAfterSend &&
        !initialLoadRef.current &&
        userId &&
        isScreenActiveRef.current // Only mark as read if screen is active
      ) {
        await markMessagesAsRead(token);
      }

      // After the first load, set initialLoad to false
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
      }

      return hasNewMessages;
    } catch (error) {
      console.error('Error fetching chat history:', error); // Debug log
      return false;
    } finally {
      setLoadingMessages(false);
    }
  };

 
  
  const sendMessage = async () => {
    if (!inputContent.trim() && !selectedFile) return; // Ensure there's either text or a file
    if (!pubnub || !contact?.pubnub_channel) {
      console.error('PubNub or contact channel is not initialized');
      return;
    }
  
    setSendingMessage(true);
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user) throw new Error('User session not found');
  
      const formData = new FormData();
      formData.append('user_id', userData.user.user_id);
      formData.append('token', contact.pubnub_channel);
  
      if (selectedFile) {
        console.log('Uploading file message:', selectedFile.uri); // Debug log
        const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);
        if (!fileInfo.exists) throw new Error('File does not exist');
  
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name || selectedFile.uri.split('/').pop() || 'file',
          type: selectedFile.type || 'application/octet-stream',
        } as any);
      }
  
      if (inputContent.trim()) {
        formData.append('message_content', inputContent.trim());
      }
  
      // Make a single API call to send the message
      const response = await fetch(`${API_BASE_URL}/api/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
  
      if (!response.ok) {
        const result = await response.json();
        console.error('Error sending message:', result); // Debug log
        throw new Error(result.error || 'Failed to send message');
      }
  
      console.log('Message sent successfully'); // Debug log
  
      // Trigger PubNub notification
      await pubnub.publish({
        channel: contact.pubnub_channel,
        message: {
          type: 'NEW_MESSAGE',
          timestamp: Date.now(),
        },
      });
  
      // Clear input and file after sending
      setInputContent('');
      setSelectedFile(null);
      await fetchChatHistory(contact.pubnub_channel, { skipMarkRead: true });
  
      if (isAtBottom) {
        setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const pickFile = async () => {
    try {
      console.log('Opening file picker...');
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0]; 
        if (file.uri) {
          console.log('File selected:', file); 
          setSelectedFile({ uri: file.uri, name: file.name, type: file.mimeType }); 
        } else {
          console.error('No valid file URI found in assets:', result); 
          alert('Failed to select a file. Please try again.');
        }
      } else if (result.canceled) {
        console.log('File selection canceled by the user');
        alert('File selection was canceled. Please try again.');
      } else {
        console.error('Unexpected result from DocumentPicker:', result);
        alert('Failed to select a file. Please try again.');
      }
    } catch (error) {
      console.error('Error picking file:', error); 
      alert('An error occurred while selecting a file. Please ensure the file picker is working correctly.');
    }
  };

  const handleScroll = (event: any) => {
    setIsAtBottom(event.nativeEvent.contentOffset.y > -20);
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
            onPress={() => sendMessage()} 
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
