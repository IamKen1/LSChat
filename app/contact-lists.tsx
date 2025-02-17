import React from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'

const ContactLists = () => {
  const contacts = [
    { id: '1', name: 'Juan Dela Cruz', phone: '+63 917-123-4567' },
    { id: '2', name: 'Maria Santos', phone: '+63 918-234-5678' },
    { id: '3', name: 'Pedro Reyes', phone: '+63 919-345-6789' },
    { id: '4', name: 'Diego Silang', phone: '+63 920-456-7890' },  ]

  const renderItem = ({ item }: { item: { name: string; phone: string } }) => (
    <TouchableOpacity className="p-4 border-b border-gray-200">
      <Text className="text-lg font-bold mb-1">{item.name}</Text>
      <Text className="text-base text-gray-600">{item.phone}</Text>
    </TouchableOpacity>
  )
  return (
    <View className="flex-1 bg-white p-4">
      <FlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default ContactLists