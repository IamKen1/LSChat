import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native'

const ContactLists = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '' })

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
    <View className="flex-1 bg-white p-4 ">
      <FlatList className='flex-1 shadow-xl'
        data={contacts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity 
        className="absolute bottom-6 right-4 w-16 h-16 bg-[#6B21A8] rounded-full items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-white text-4xl shadow-gray-100">+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-lg w-[80%]">
            <Text className="text-xl font-bold mb-4">Add New Contact</Text>
            <TextInput
              className="border border-gray-300 p-2 rounded-lg mb-4"
              placeholder="Name"
              value={newContact.name}
              onChangeText={(text) => setNewContact({...newContact, name: text})}
            />
            <TextInput
              className="border border-gray-300 p-2 rounded-lg mb-4"
              placeholder="Phone Number"
              value={newContact.phone}
              onChangeText={(text) => setNewContact({...newContact, phone: text})}
              keyboardType="phone-pad"
            />
            <View className="flex-row justify-end space-x-4">
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                className="px-4 py-2"
              >
                <Text className="text-gray-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false)
                  setNewContact({ name: '', phone: '' })
                }}
                className="bg-[#6B21A8] px-4 py-2 rounded-lg"
              >
                <Text className="text-white">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default ContactLists