import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, SectionList, SectionListData, Alert } from 'react-native'
import { API_BASE_URL } from '@/config'
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Contact {
    id: string
    name: string
    phone: string
    status: 'pending' | 'accept' | 'reject'
}
const ContactLists = () => {
    const [modalVisible, setModalVisible] = useState(false)
    const [newContact, setNewContact] = useState<Contact>({ id: '', name: '', phone: '', status: 'pending' })
    const [searchResults, setSearchResults] = useState<Contact[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [contacts, setContacts] = useState<Contact[]>([])
    const [pendingRequests, setPendingRequests] = useState<Contact[]>([])
    const [showPendingRequests, setShowPendingRequests] = useState(false)
    const sectionListRef = useRef<SectionList>(null)

    const fetchData = useCallback(async () => {
        const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}')
        if (!userData.user) return null
        return userData
    }, [])

    const handleFriendRequest = async (requesterId: string, status: 'accept' | 'reject') => {
        try {
            const userData = await fetchData()
            if (!userData) return

            const confirmAction = await new Promise((resolve) => {
                Alert.alert(
                    'Confirm Action',
                    `Would you like to ${status} this friend request?`,
                    [
                        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                        { text: 'Confirm', onPress: () => resolve(true) }
                    ]
                )
            })

            if (!confirmAction) return

            const response = await fetch(`${API_BASE_URL}/api/update-contact-list`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userData.user.user_id,
                    requester_id: requesterId,
                    status
                })
            })

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            const data = await response.json()
            if (data.success) {
                await Promise.all([fetchFriendRequests(), fetchContactLists()])
                Alert.alert('Success', `Friend request has been ${status === 'accept' ? 'accepted' : 'rejected'} successfully.`)
            }
        } catch (error) {
            console.error('Error handling friend request:', error)
            Alert.alert('Error', 'Failed to process friend request')
        }
    }

    const fetchFriendRequests = async () => {
        try {
            const userData = await fetchData()
            if (!userData) return

            const response = await fetch(`${API_BASE_URL}/api/fetch-friend-requests?contact_id=${userData.user.user_id}`)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            
            const data = await response.json()
            const formattedRequests = data.map((request: any) => ({
                id: String(request.user_id),
                name: request.requester_full_name,
                phone: request.mobile_number,
                status: request.status
            }))
            setPendingRequests(formattedRequests)
        } catch (error) {
            console.error('Error fetching friend requests:', error)
            setPendingRequests([])
        }
    }

    const fetchContactLists = async () => {
        try {
            const userData = await fetchData()
            if (!userData) return

            const response = await fetch(`${API_BASE_URL}/api/fetch-contact-lists?user_id=${userData.user.user_id}`)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            
            const data = await response.json()
            const formattedContacts = data
                .filter((contact: any) => String(contact.contact_id) !== String(userData.user.user_id))
                .map((contact: any) => ({
                    id: String(contact.contact_id),
                    name: contact.contact_full_name,
                    phone: contact.contact_mobile_number,
                    status: contact.status 
                }))
            
            setContacts(formattedContacts)
        } catch (error) {
            console.error('Error fetching contacts:', error)
            setContacts([])
        }
    }    

    useEffect(() => {
        fetchContactLists()
        fetchFriendRequests()
    }, [])

    const closeModal = useCallback(() => {
        setModalVisible(false)
        setShowDropdown(false)
        setNewContact({ id: '', name: '', phone: '', status: 'pending' })
        setSearchResults([])
    }, [])

    const handleSelectContact = useCallback((contact: Contact) => {
        setNewContact({ ...contact, status: 'pending' })
        setShowDropdown(false)
    }, [])

    const searchContacts = useCallback(async (query: string) => {
        try {
            const userData = await fetchData()
            if (!userData) return

            const response = await fetch(`${API_BASE_URL}/api/search-contacts?search_data=${encodeURIComponent(query)}`)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            const data = await response.json()
            const filtered = data
                .filter((item: any) => 
                    userData.user?.user_id !== item.user_id && 
                    !contacts.some(contact => contact.id === String(item.user_id))
                )
                .map((item: any) => ({
                    name: `${item.first_name} ${item.last_name}`,
                    phone: item.mobile_number,
                    id: String(item.user_id),
                    status: 'pending'
                }))
            
            setSearchResults(filtered)
            setShowDropdown(true)
        } catch (error) {
            console.error('Error searching contacts:', error)
            setSearchResults([])
        }
    }, [contacts])

    const addContactToList = useCallback(async (contact: Contact) => {
        if (!contact.id) return

        try {
            const userData = await fetchData()
            if (!userData) return

            const response = await fetch(`${API_BASE_URL}/api/add-contact-to-list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userData.user.user_id,
                    contact_id: Number(contact.id),
                    status: 'pending'
                }),
            })

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

            const data = await response.json()
            if (data.success) {
                closeModal()
                fetchContactLists()
                fetchFriendRequests()
            }
        } catch (error) {
            console.error('Error adding contact:', error)
        }
    }, [closeModal])

    const groupedContacts = useMemo(() => {
        const groups = contacts.reduce((acc: { [key: string]: Contact[] }, contact) => {
            const firstLetter = contact.name[0].toUpperCase()
            if (!acc[firstLetter]) acc[firstLetter] = []
            acc[firstLetter].push(contact)
            return acc
        }, {})
        
        return Object.keys(groups).sort().map(letter => ({
            title: letter,
            data: groups[letter].sort((a, b) => a.name.localeCompare(b.name))
        }))
    }, [contacts])

    const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

    const onAlphabetPress = useCallback((letter: string) => {
        const sectionIndex = groupedContacts.findIndex(section => section.title === letter)
        if (sectionIndex !== -1) {
            sectionListRef.current?.scrollToLocation({
                sectionIndex,
                itemIndex: 0,
                animated: true,
                viewPosition: 0
            })
        }
    }, [groupedContacts])

    const renderContact = useCallback(({ item }: { item: Contact }) => (
        <TouchableOpacity 
            className="py-2 px-4 border-b border-gray-100"
            onPress={() => showDropdown && handleSelectContact(item)}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3">
                        <Text className="text-lg text-purple-800">{item.name[0].toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
                        <Text className="text-sm text-gray-600">{item.phone}</Text>
                    </View>
                </View>
                {item.status !== 'accept' && (
                    <View className={`px-2 py-2 rounded-full ${item.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                        <Text className={`text-xs font-semibold ${item.status === 'pending' ? 'text-yellow-800' : 'text-red-800'}`}>
                            {item.status}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    ), [showDropdown])

    const renderSectionHeader = useCallback(({ section }: { section: SectionListData<Contact> }) => (
        <View className="py-2 px-4 bg-gray-100">
            <Text className="text-lg font-bold text-purple-800">{section.title}</Text>
        </View>
    ), [])

    const SearchResultItem = useCallback(({ contact, onPress }: { contact: Contact, onPress: () => void }) => (
        <TouchableOpacity
            onPress={onPress}
            className="p-4 border-b border-gray-100 flex-row items-center"
        >
            <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center mr-4">
                <Text className="text-xl text-purple-800">{contact.name[0].toUpperCase()}</Text>
            </View>
            <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">{contact.name}</Text>
                <Text className="text-sm text-gray-500">{contact.phone}</Text>
            </View>
        </TouchableOpacity>
    ), [])

    return (
        <View className="flex-1 bg-white">
            {pendingRequests.length > 0 && (
                <View className="bg-yellow-50">
                    <TouchableOpacity 
                        className="p-4 flex-row justify-between items-center" 
                        onPress={() => setShowPendingRequests(!showPendingRequests)}
                    >
                        <View className="flex-row items-center">
                            <Text className="text-lg font-bold text-yellow-800">Friend Requests</Text>
                            <View className="ml-2 bg-yellow-200 px-2 py-1 rounded-full">
                                <Text className="text-yellow-800 font-bold">{pendingRequests.length}</Text>
                            </View>
                        </View>
                        <Text className="text-yellow-800 ml-2 text-lg">{showPendingRequests ? '▼' : '▶'}</Text>
                    </TouchableOpacity>
                    {showPendingRequests && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-4 px-4">
                            {pendingRequests.map((request) => (
                                <TouchableOpacity 
                                    key={request.id} 
                                    className="mr-4 bg-white p-3 rounded-lg w-[120px] shadow-sm"
                                    onPress={() => {
                                        Alert.alert(
                                            'Friend Request',
                                            'What would you like to do with this request?',
                                            [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Accept', onPress: () => handleFriendRequest(request.id, 'accept') },
                                                { 
                                                    text: 'Reject',
                                                    onPress: () => handleFriendRequest(request.id, 'reject'),
                                                    style: 'destructive'
                                                }
                                            ]
                                        )
                                    }}
                                >
                                    <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center mb-2">
                                        <Text className="text-xl text-purple-800">{request.name[0].toUpperCase()}</Text>
                                    </View>
                                    <Text className="text-sm font-semibold text-gray-800">{request.name}</Text>
                                    <Text className="text-xs text-gray-600">{request.phone}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}
            
            <View className="flex-1 flex-row">
                <View className="flex-1">
                    <SectionList
                        ref={sectionListRef}
                        sections={groupedContacts}
                        renderItem={renderContact}
                        renderSectionHeader={renderSectionHeader}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        stickySectionHeadersEnabled={true}
                    />
                    <TouchableOpacity
                        className="absolute bottom-6 right-4 w-16 h-16 bg-[#6B21A8] rounded-full items-center justify-center shadow-lg"
                        onPress={() => setModalVisible(true)}
                    >
                        <Text className="text-white text-4xl">+</Text>
                    </TouchableOpacity>
                </View>

                <View className="w-8 bg-transparent justify-center">
                    <ScrollView className="py-2">
                        {alphabet.map((letter) => (
                            <TouchableOpacity
                                key={letter}
                                onPress={() => onAlphabetPress(letter)}
                                className="items-center py-0.5"
                            >
                                <Text className="text-xs text-purple-800 font-semibold">{letter}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white p-5 rounded-lg w-[80%]">
                        <Text className="text-lg font-bold mb-4">Add New Contact</Text>
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
                                            <SearchResultItem
                                                key={index}
                                                contact={contact}
                                                onPress={() => handleSelectContact(contact)}
                                            />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        <View className="flex-row justify-end space-x-4">
                            <TouchableOpacity onPress={closeModal} className="px-4 py-2">
                                <Text className="text-gray-500">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => addContactToList(newContact)}
                                className={`px-4 py-2 rounded-lg ${newContact.id ? 'bg-[#6B21A8]' : 'bg-gray-300'}`}
                                disabled={!newContact.id}
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
