import React, { useState, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native'
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

    const contacts: Contact[] = useMemo(() => [
        { id: '1', name: 'Juan Dela Cruz', phone: '+63 917-123-4567' },
        { id: '2', name: 'Maria Santos', phone: '+63 918-234-5678' },
        { id: '3', name: 'Pedro Reyes', phone: '+63 919-345-6789' },
        { id: '4', name: 'Diego Silang', phone: '+63 920-456-7890' },
    ], [])

    const searchContacts = async (query: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/search-contacts?search_data=${query}`)
            const data = await response.json()
            setSearchResults(data.map((item: { first_name: string; last_name: string; user_id: number }) => ({
                name: `${item.first_name} ${item.last_name}`,
                phone: '',
                id: item.user_id.toString()
            })))
            setShowDropdown(true)
        } catch (error) {
            console.error('Error searching contacts:', error)
        }
    }

    const renderContact = useMemo(() => ({ item }: { item: Contact }) => (
        <TouchableOpacity 
            className="p-4 border-b border-gray-200"
            onPress={() => showDropdown && handleSelectContact(item)}
        >
            <Text className="text-lg font-bold mb-1">{item.name}</Text>
            <Text className="text-base text-gray-600">{item.phone}</Text>
        </TouchableOpacity>
    ), [showDropdown])

    const handleSelectContact = useMemo(() => (contact: Contact) => {
        setNewContact(contact)
        setShowDropdown(false)
    }, [])

    const closeModal = useMemo(() => () => {
        setModalVisible(false)
        setShowDropdown(false)
        setNewContact({ id: '', name: '', phone: '' })
        setSearchResults([])
    }, [])

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
                                    <FlatList
                                        className="bg-gray-200/30"
                                        data={searchResults}
                                        renderItem={renderContact}
                                        keyExtractor={(_, index) => index.toString()}
                                        nestedScrollEnabled
                                    />
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