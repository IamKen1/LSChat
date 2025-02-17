import React from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'

const ContactLists = () => {
  const contacts = [
    { id: '1', name: 'Juan Dela Cruz', phone: '+63 917-123-4567' },
    { id: '2', name: 'Maria Santos', phone: '+63 918-234-5678' },
    { id: '3', name: 'Pedro Reyes', phone: '+63 919-345-6789' },
    { id: '4', name: 'Diego Silang', phone: '+63 920-456-7890' },  ]

  const renderItem = ({ item }: { item: { name: string; phone: string } }) => (
    <TouchableOpacity style={styles.contactItem}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.phone}>{item.phone}</Text>
    </TouchableOpacity>
  )
  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
})

export default ContactLists
