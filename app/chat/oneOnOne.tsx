import React from 'react';
import { View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native'; // Explicit Text import

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
}

interface MessageItemProps {
  item: Message;
  contactId: string | null;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({ item, contactId }) => (
  <View
    className={`p-3 m-2 rounded-lg ${
      item.sender_id === contactId ? 'bg-gray-200 self-start' : 'bg-[#6B21A8] self-end'
    }`}
  >
    <Text className={`text-sm ${item.sender_id === contactId ? 'text-black' : 'text-white'}`}>
      {item.message}
    </Text>
    <Text className={`text-xs ${item.sender_id === contactId ? 'text-gray-300' : 'text-white'} mt-1`}>
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
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    if (contactId) {
      fetchContactDetails();
      fetchMockMessages();
    }
  }, [contactId]);

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
        });
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
    }
  };

  const fetchMockMessages = () => {
    // Mock data for messages in Tagalog
    const mockMessages: Message[] = [
      {
        id: '1',
        sender_id: contactId,
        message: 'Kamusta? tanggol?',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        sender_id: 'user',
        message: 'Binaril ko si David! Ikaw, kumusta?',
        created_at: new Date().toISOString(),
      },
    ];
    setMessages(mockMessages);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const newMessageObj: Message = {
      id: `${Date.now()}`,
      sender_id: 'user',
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessageObj]);
    setNewMessage('');
    flatListRef.current?.scrollToEnd({ animated: true });
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
            <Text className="text-white text-xl font-bold">{contact?.name}</Text>
            <Text className="text-white text-sm">{contact?.phone}</Text>
          </View>
        </LinearGradient>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageItem item={item} contactId={contactId} />}
          contentContainerStyle={{ padding: 10 }}
        />

        <View className="flex-row items-center p-4 border-t border-gray-200">
          <TextInput
            className="flex-1 bg-gray-100 p-3 rounded-full text-base"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            className="ml-3 p-2"
            disabled={!newMessage.trim()}
          >
            <Text>
              <Ionicons 
                name="send" 
                size={24} 
                color={newMessage.trim() ? '#6B21A8' : '#CBD5E0'} 
              />
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
