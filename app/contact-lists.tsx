import React, { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput,ScrollView } from 'react-native'
import { API_BASE_URL } from '@/config'

interface Contact {
    id: string
    name: string
    phone: string
}

const ContactLists = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [newContact, setNewContact] = useState<Contact>({ id: '', name: '', phone: '' })
    const [searchResults, setSearchResults] = useState<Contact[]>([])
    const [showDropdown, setShowDropdown] = useState(false)

    const contacts: Contact[] = [
        { id: '1', name: 'Juan Dela Cruz', phone: '+63 917-123-4567' },
        { id: '2', name: 'Maria Santos', phone: '+63 918-234-5678' },
        { id: '3', name: 'Pedro Reyes', phone: '+63 919-345-6789' },
        { id: '4', name: 'Diego Silang', phone: '+63 920-456-7890' },
    ]

    const searchContacts = async (query: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/search-contacts?search_data=${query}`)
            const data = await response.json()
            setSearchResults(data.map((item: { first_name: string; last_name: string; user_id: number; mobile_number: string; }) => ({
                name: `${item.first_name} ${item.last_name}`,
                phone: `${item.mobile_number}`,
                id: item.user_id.toString()
            })))
            setShowDropdown(true)
        } catch (error) {
            console.error('Error searching contacts:', error)
        }
    }
    const renderContact = ({ item }: { item: Contact }) => (
        <TouchableOpacity 
            className=" pb-2 mb-1 bg-white shadow-sm  border-b-gray-200"
            onPress={() => showDropdown && handleSelectContact(item)}
        >
            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                        <Text className="text-lg text-purple-800">{item.name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
                        <Text className="text-sm text-gray-600 mt-1">{item.phone}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    )
    const handleSelectContact = (contact: Contact) => {
        setNewContact(contact)
        setShowDropdown(false)
    }

    const closeModal = () => {
        setModalVisible(false)
        setShowDropdown(false)
        setNewContact({ id: '', name: '', phone: '' })
        setSearchResults([])
    }

    return (
        <View className="flex-1 bg-white p-4">
            <FlatList 
                className='flex-1 shadow-xl'
                data={contacts}
                renderItem={renderContact}
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
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white p-6 rounded-lg w-[80%]">
                        <Text className="text-xl font-bold mb-4">Add New Contact</Text>
                        <View className="relative">
                            <TextInput
                                className="border border-gray-300 p-2 rounded-lg mb-4"
                                placeholder="Search contacts..."
                                value={newContact.name}
                                onChangeText={text => {
                                    setNewContact({ ...newContact, name: text })
                                    searchContacts(text)
                                }}
                            />
                            {showDropdown && searchResults.length > 0 && (
                                <View className="absolute top-11 left-0 right-0 max-h-40 border bg-white border-gray-300 rounded-lg overflow-hidden z-50">
                                    <ScrollView>
                                        {searchResults.map((contact, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => handleSelectContact(contact)}
                                                className="p-3 border-b border-gray-200 hover:bg-gray-100"
                                            >
                                                <Text className="text-gray-800">{contact.name}</Text>
                                                <Text className="text-gray-500 text-sm">{contact.phone}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>                          
                              )}
                        </View>
                        <View className="flex-row justify-end space-x-4">
                            <TouchableOpacity
                                onPress={closeModal}
                                className="px-4 py-2"
                            >
                                <Text className="text-gray-500">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={closeModal}
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