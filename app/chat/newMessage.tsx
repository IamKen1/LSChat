import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native'
import { API_BASE_URL } from '../../config'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient'; 
import UserAvatar from '../../src/components/common/UserAvatar';
import Header from '../../src/components/common/Header';

interface Contact {
    id: string;
    name: string;
    phone: string;
    status: string;
}

function NewMessage() {
    const fetchData = useCallback(async () => {
        const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}')
        if (!userData.user) return null
        return userData
    }, [])

    const [contacts, setContacts] = useState<Contact[]>([])
    const [searchQuery, setSearchQuery] = useState('')

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
    }, [])

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery)
    )

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FA]" style={{ paddingTop: StatusBar.currentHeight }}>
            <Header 
                title="New Message"
                showBackButton={true}
            />
            <View className="p-4">
                <View className="flex-row items-center bg-white/90 rounded-xl p-2 shadow-sm">
                    <Text className="text-[#8E24AA] text-xl mx-2">🔍</Text>
                    <TextInput
                        className="flex-1 p-2 text-base"
                        placeholder="Search contacts..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>
            <ScrollView className="flex-1 px-2">
                {filteredContacts.map((contact) => (
                    <TouchableOpacity
                        key={contact.id}
                        className="flex-row items-center p-4 my-1 bg-white rounded-xl shadow-sm border border-gray-100"
                        onPress={() =>
                            router.push({
                                pathname: "/chat/oneOnOne",
                                params: { contactId: contact.id, contactName: contact.name },
                            })
                        }
                    >
                        <UserAvatar
                            name={contact.name}
                            size={48}
                            containerClassName="mr-4 bg-[#6B21A8]"
                            textClassName="text-white text-lg"
                        />
                        <View className="flex-1">
                            <Text className="text-gray-800 font-semibold text-lg">{contact.name}</Text>
                            <Text className="text-gray-500">{contact.phone}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() =>
                                router.push({
                                    pathname: "/chat/oneOnOne",
                                    params: { contactId: contact.id, contactName: contact.name },
                                })
                            }
                        >
                            <Text>
                                <Text className="text-[#8E24AA] text-xl">💬</Text>
                            </Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    )
}

export default NewMessage