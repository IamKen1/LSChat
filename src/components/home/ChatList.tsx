import React from 'react';
import { View, ScrollView, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import ChatListItem from './ChatListItem';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import GroupInvitations from '../groups/GroupInvitations';

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

interface ChatListProps {
  chatGroups: ChatGroup[];
  oneOnOneChats: OneOnOneChat[];
  handleChatPress: (token: string) => void;
  handleOneOnOnePress: (contactId: string) => void;
  refreshGroupsData: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chatGroups,
  oneOnOneChats,
  handleChatPress,
  handleOneOnOnePress,
  refreshGroupsData,
}) => {
  // Ensure we have a valid name for avatar display
  const ensureValidName = (name: string): string => {
    return name || 'Unknown';
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView className="flex-1">
        {/* Group Invitations Section */}
        <GroupInvitations onInvitationResponded={refreshGroupsData} />

        {/* Group Chats Section */}
        {chatGroups.map((group) => (
          <ChatListItem
            key={group.id}
            id={group.id}
            name={ensureValidName(group.name)}
            token={group.token}
            lastMessage={group.lastMessage}
            time={group.time}
            isNewMessage={group.isNewMessage}
            onPress={() => handleChatPress(group.token)}
          />
        ))}

        {/* One-on-One Chats Section */}
        {oneOnOneChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            id={chat.id}
            name={ensureValidName(chat.name)}
            token={chat.contact_id}
            lastMessage={chat.lastMessage}
            time={chat.time}
            isNewMessage={chat.isNewMessage}
            onPress={() => handleOneOnOnePress(chat.contact_id)}
          />
        ))}
      </ScrollView>

      {/* Using standard TouchableOpacity instead of gesture handler version */}
      <RNTouchableOpacity
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          width: 60,
          height: 60,
          backgroundColor: '#6B21A8',
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          zIndex: 10,
        }}
        onPress={() => router.push('/chat/newMessage')}
        activeOpacity={0.7}
      >
        <Icon name="message" size={28} color="white" />
      </RNTouchableOpacity>
    </View>
  );
};

export default ChatList;
