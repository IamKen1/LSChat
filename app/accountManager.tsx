import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View, TextInput, FlatList, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Menu, MenuTrigger, MenuOptions, MenuOption, MenuProvider } from 'react-native-popup-menu';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '../config';
import * as ImagePicker from 'expo-image-picker';

export default function AccountManager() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [portalName, setPortalName] = useState('');
  const [portals, setPortals] = useState<Array<{ name: string, token?: string, status?: string }>>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New state for rename modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameIndex, setRenameIndex] = useState<number | null>(null);
  const [newPortalName, setNewPortalName] = useState('');

  // Create a ref that will always hold the current selectedPortal value.
  const selectedPortalRef = useRef<number | null>(null);

  // Sync the ref each time selectedPortal changes.
  useEffect(() => {
    selectedPortalRef.current = selectedPortal;
    if (selectedPortal !== null) {
      console.log('Selected portal updated:', selectedPortal);
    }
  }, [selectedPortal]);

  // Fetch saved portals from the server
  useEffect(() => {
    const fetchSavedPortals = async () => {
      try {
        const userSessionData = await AsyncStorage.getItem('userSession');
        if (userSessionData) {
          const userData = JSON.parse(userSessionData);
          const response = await fetch(`${API_BASE_URL}/api/fetchAccounts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userData.user.user_id
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Fetched portals:', data);
            if (data.success) {
              const savedPortals = Array.isArray(data.accounts) ? data.accounts : [data.accounts];
              setPortals(savedPortals.map((portal: any) => ({
                name: portal.name,
                token: portal.channel,
                status: portal.status
              })));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching saved portals:', error);
      }
    };

    fetchSavedPortals();
    console.log('refresh trigger 1', refreshTrigger);
  }, [refreshTrigger]);

  // Handle reconnection of inactive portals
  const handleReconnect = async (index: number) => {
    Alert.alert(
      'Confirm Reconnection',
      'Are you sure you want to reconnect this portal?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reconnect',
          onPress: async () => {
            try {
              const userSessionData = await AsyncStorage.getItem('userSession');
              const statusData = {
                status: 'active'
              };
              if (userSessionData && portals[index].token) {
                const userData = JSON.parse(userSessionData);
                const response = await fetch(`${API_BASE_URL}/api/accounts/update/${portals[index].token}/${userData.user.user_id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify(statusData),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(errorText);
                }

                const data = await response.json();
                console.log('data', data);
                if (data.status) {
                  setRefreshTrigger(prev => prev + 1);
                  Alert.alert('Success', data.message || 'Failed to reconnect account');
                }
              }
              console.log('refresh trigger 2', refreshTrigger);
            } catch (error) {
              console.error('Error reconnecting portal:', error);
              Alert.alert('Error', 'Failed to reconnect portal. Please try again later.');
            }
          }
        }
      ]
    );
  };

  // Switch between front and back camera
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Add new portal to the list
  const addPortal = () => {
    const trimmedName = portalName.trim();
    if (trimmedName) {
      // Check for duplicate portal name (ignoring case)
      const duplicate = portals.find(
        portal => portal.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        Alert.alert("Duplicate Portal", "This portal name already exists");
        return;
      }
      setPortals([...portals, { name: trimmedName }]);
      setPortalName('');
    }
  };

  const handlePortalNameChange = (text: string) => {
    setPortalName(text);
  };

  // Modified rename logic: open a modal to enter new name
  const openRenameModal = (index: number) => {
    setRenameIndex(index);
    setNewPortalName(portals[index].name);
    setShowRenameModal(true);
  };

  const handleConfirmRename = async () => {
    if (renameIndex === null) return;
    await renamePortal(renameIndex, newPortalName);
    // close modal and clear rename state
    setShowRenameModal(false);
    setRenameIndex(null);
    setNewPortalName('');
  };

  const renamePortal = async (index: number, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
  
    // Check for duplicate portal name (ignoring case)
    const duplicate = portals.find(
      (portal, i) =>
        portal.name.toLowerCase() === trimmedName.toLowerCase() && i !== index
    );
    if (duplicate) {
      Alert.alert("Duplicate Portal", "This portal name already exists");
      return;
    }
  
    try {
      // Only call the API if there is a channel token (i.e., the account is connected)
      if (portals[index].token) {
        const userSessionData = await AsyncStorage.getItem('userSession');
        if (userSessionData) {
          const userData = JSON.parse(userSessionData);
          const response = await fetch(`${API_BASE_URL}/api/updateAccount`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              user_id: userData.user.user_id,
              name: trimmedName,
              channel: portals[index].token
            }),
          });
    
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
          }
    
          const data = await response.json();
          if (!data.success) {
            Alert.alert("Error", data.message || "Failed to update account");
            return;
          }
        }
      }
      // Update the local state after a successful API call
      const updatedPortals = [...portals];
      updatedPortals[index].name = trimmedName;
      setPortals(updatedPortals);
      Alert.alert("Success", "Account name updated successfully");
    } catch (error) {
      console.error("Error renaming portal:", error);
      Alert.alert("Error", "Failed to update portal name. Please try again later.");
    }
  };

  // Remove portal and update its status to inactive
  const removePortal = async (index: number) => {
    Alert.alert(
      'Confirm Disconnection',
      'Are you sure you want to disconnect this portal?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const userSessionData = await AsyncStorage.getItem('userSession');
              const statusData = {
                status: 'inactive'
              };
              if (userSessionData && portals[index].token) {
                const userData = JSON.parse(userSessionData);
                const response = await fetch(`${API_BASE_URL}/api/accounts/update/${portals[index].token}/${userData.user.user_id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify(statusData),
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(errorText);
                }

                const data = await response.json();

                if (data.status) {
                  setRefreshTrigger(prev => prev + 1);
                  Alert.alert('Success', data.message || 'Failed to remove account');
                }
                console.log('refresh trigger 3', refreshTrigger);
              } else {
                const updatedPortals = [...portals];
                updatedPortals.splice(index, 1);
                setPortals(updatedPortals);
              }
            } catch (error) {
              console.error('Error removing portal:', error);
              Alert.alert('Error', 'Failed to remove portal. Please try again later.');
            }
          }
        }
      ]
    );
  };

  // Handle portal selection for QR scanning
  const handlePortalPress = (index: number) => {
    console.log('handlePortalPress index', index);
    if (!portals[index].token) {
      setSelectedPortal(index);
      setShowCamera(true);
    }
  };

  // Open image picker to scan a QR code from an image
  const pickImage = (index: number) => {
    setSelectedPortal(index);
    setIsScanning(false);

    ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 1,
    }).then(async result => {
      if (!result.canceled) {
        const scannedResults = await Camera.scanFromURLAsync(result.assets[0].uri);
        if (scannedResults.length > 0) {
          const qrData = scannedResults[0].data;
          handleQRCodeScanned({ data: qrData }, true);
        }
      }
    });
  };

  // Create new account with scanned QR token
  const createAccount = async (token: string) => {
    try {
      const userSessionData = await AsyncStorage.getItem('userSession');
      if (userSessionData) {
        const userData = JSON.parse(userSessionData);
        setUserId(userData.user.user_id);

        const selectedPortalName = portals[selectedPortalRef.current!].name;
        console.log('selectedPortalName', selectedPortalName);
        const response = await fetch(`${API_BASE_URL}/api/createAccount`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userData.user.user_id,
            name: selectedPortalName,
            channel: token
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to create account');
        }
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  // Process scanned QR code data using the selectedPortalRef for the latest portal index
  const handleQRCodeScanned = ({ data }: { data: string }, fromImagePicker: boolean = false) => {
    console.log('handleQRCodeScanned SelectedPortal', selectedPortalRef.current);
    if (selectedPortalRef.current === null) {
      return; // Early return if selectedPortal is null
    }

    if (!isScanning) {
      setIsScanning(true);

      const isDuplicate = portals.some(portal => portal.token === data);
      if (isDuplicate) {
        Alert.alert('Duplicate Channel', 'This channel has already been added.');
        setShowCamera(false);
        setIsScanning(false);
        return;
      }

      const updatedPortals = [...portals];
      updatedPortals[selectedPortalRef.current].token = data;

      createAccount(data).then(() => {
        Alert.alert('Success', 'Account successfully connected!');
        if (!fromImagePicker) {
          setShowCamera(false);
        }
        setIsScanning(false);
      });
    }
  };

  if (!permission) {
    return <SafeAreaView />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-slate-50">
        <Text className="text-center pb-2.5 text-slate-700 font-medium">Camera Permission Required</Text>
        <TouchableOpacity
          className="mx-4 bg-indigo-600 py-3 rounded-xl shadow-lg"
          onPress={requestPermission}
        >
          <Text className="text-white text-center font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (showCamera) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <CameraView
          style={{ flex: 1 }}
          facing={facing}
          onBarcodeScanned={isScanning ? undefined : handleQRCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
            className="flex-1 justify-center items-center"
          >
            <View className="w-[75%] h-[55%] border-2 border-transparent relative">
              <View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-indigo-400" />
              <View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-indigo-400" />
              <View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-indigo-400" />
              <View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-indigo-400" />
            </View>
            <Text className="text-white text-lg font-medium mt-6 text-center">Scan QR Code</Text>
            <View className="absolute bottom-12 left-0 right-0 flex-row justify-around px-[50px]">
              <TouchableOpacity
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-lg justify-center items-center"
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-lg justify-center items-center"
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </CameraView>
      </SafeAreaView>
    );
  }
  
  return (
    <MenuProvider>
      <SafeAreaView className="flex-1 bg-slate-50">
        <LinearGradient colors={['#6B21A8', '#3B0764']} className="p-4 ">
          <Text className="text-white text-xl font-bold text-center">Account Manager</Text>
        </LinearGradient>
        <View>
          <View className="bg-white shadow-lg p-2 mb-2">
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 p-4 bg-slate-50 text-base font-medium mr-2"
                value={portalName}
                onChangeText={handlePortalNameChange}
                placeholder="Enter portal name"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity className="bg-[#6B21A8] p-4 shadow-lg" onPress={addPortal}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={portals}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                className="bg-white shadow-lg mb-3 overflow-hidden"
                onPress={() => handlePortalPress(index)}
              >
                <View className="p-5">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-semibold text-slate-800">{item.name}</Text>
                    <View className="flex-row items-center">
                      {item.token ? (
                        item.status === 'active' ? (
                          <View className="flex-row items-center mr-4 bg-green-100 px-3 py-1.5 rounded-full">
                            <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
                            <Text className="text-sm text-green-700 font-medium">Connected</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            className="flex-row items-center mr-4 bg-red-100 px-3 py-1.5 rounded-full"
                            onPress={() => handleReconnect(index)}
                          >
                            <Ionicons name="refresh" size={16} color="#EF4444" className="mr-2" />
                            <Text className="text-sm text-red-700 font-medium">Reconnect</Text>
                          </TouchableOpacity>
                        )
                      ) : (
                        <View className="flex-row">
                          <TouchableOpacity
                            className="mr-2 bg-indigo-100 p-2 rounded-full"
                            onPress={() => handlePortalPress(index)}
                          >
                            <Ionicons name="scan" size={24} color="#4F46E5" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="mr-4 bg-indigo-100 p-2 rounded-full"
                            onPress={() => pickImage(index)}
                          >
                            <Ionicons name="image" size={24} color="#4F46E5" />
                          </TouchableOpacity>
                        </View>
                      )}
                      <Menu>
                        <MenuTrigger>
                          <Ionicons name="ellipsis-vertical" size={24} color="#64748B" />
                        </MenuTrigger>
                        <MenuOptions
                          customStyles={{
                            optionsContainer: {
                              borderRadius: 5,
                              padding: 2,
                            },
                          }}
                        >
                          <MenuOption onSelect={() => removePortal(index)}>
                            <View className="flex-row items-center p-1">
                              <Ionicons name="flash-off-outline" size={16} color="#EF4444" />
                              <Text className="ml-3 text-sm font-medium text-red-500">Disconnect</Text>
                            </View>
                          </MenuOption>
                          <MenuOption onSelect={() => openRenameModal(index)}>
                            <View className="flex-row items-center p-1">
                              <Ionicons name="pencil-outline" size={16} color="#64748B" />
                              <Text className="ml-3 text-sm font-medium text-red-500">Rename</Text>
                            </View>
                          </MenuOption>
                        </MenuOptions>
                      </Menu>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        <Modal
          visible={showRenameModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRenameModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ width: '80%', backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Rename Portal</Text>
              <TextInput
                value={newPortalName}
                onChangeText={setNewPortalName}
                placeholder="Enter new portal name"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 20 }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={{ marginRight: 10 }} onPress={() => setShowRenameModal(false)}>
                  <Text style={{ fontSize: 16, color: 'red' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmRename}>
                  <Text style={{ fontSize: 16, color: 'blue' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </MenuProvider>
  );
}
