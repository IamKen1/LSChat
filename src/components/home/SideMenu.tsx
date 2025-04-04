import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Dimensions, BackHandler, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  onProfilePress: () => void;
  onAccountPress: () => void;
  onLogoutPress: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({
  visible,
  onClose,
  onProfilePress,
  onAccountPress,
  onLogoutPress,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = screenWidth * 0.7;
  const imageWidth = menuWidth * 0.8;
  
  // Set up animation value
  const slideAnim = useRef(new Animated.Value(-menuWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const animationInProgress = useRef(false);

  // Handle animation when visibility changes
  useEffect(() => {
    animationInProgress.current = true;
    
    if (visible) {
      // Slide in from left and fade in backdrop
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.6,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start(() => {
        animationInProgress.current = false;
      });
    } else {
      // Slide out to left and fade out backdrop
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -menuWidth,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start(() => {
        animationInProgress.current = false;
      });
    }
  }, [visible, slideAnim, backdropOpacity, menuWidth]);
  
  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        if (!animationInProgress.current) {
          onClose();
        }
        return true;
      }
      return false;
    });
    
    return () => backHandler.remove();
  }, [visible, onClose]);

  // Handle menu button press with animation completion
  const handleMenuPress = (callback: () => void) => {
    if (animationInProgress.current) return;
    
    // Start closing animation
    animationInProgress.current = true;
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -menuWidth,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start(() => {
      onClose();
      animationInProgress.current = false;
      setTimeout(callback, 50); // Short delay before navigation
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        if (!animationInProgress.current) onClose();
      }}
      animationType="none" // Using our custom animation
      hardwareAccelerated={true} // Better performance
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1 }}>
        {/* Animated backdrop */}
        <Animated.View 
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            opacity: backdropOpacity,
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              if (!animationInProgress.current) onClose();
            }}
          />
        </Animated.View>
        
        {/* Animated menu */}
        <Animated.View 
          style={{
            width: menuWidth,
            height: '100%',
            backgroundColor: 'white',
            borderTopRightRadius: 24,
            transform: [{ translateX: slideAnim }],
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <LinearGradient 
            colors={['#6B21A8', '#3B0764']} 
            style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}
          >
            <Image
              source={require('../../../assets/logo/ls_chat4.png')}
              style={{
                width: imageWidth,
                height: 120,
                marginTop: 10,
                marginBottom: 6,
                resizeMode: 'contain',
              }}
            />
          </LinearGradient>

          <View style={{ padding: 8, marginTop: 16 }}>
            <TouchableOpacity
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16, 
                marginBottom: 8,
                borderRadius: 16
              }}
              onPress={() => handleMenuPress(onProfilePress)}
              activeOpacity={0.7}
            >
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20,
                backgroundColor: '#EEF2FF',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="account-circle" size={24} color="#6B21A8" />
              </View>
              <Text style={{ marginLeft: 16, fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                Profile Management
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16, 
                marginBottom: 8,
                borderRadius: 16
              }}
              onPress={() => handleMenuPress(onAccountPress)}
              activeOpacity={0.7}
            >
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20,
                backgroundColor: '#EEF2FF',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name="list" size={24} color="#6B21A8" />
              </View>
              <Text style={{ marginLeft: 16, fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                Account Manager
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 20,
              marginTop: 'auto',
              backgroundColor: '#FEE2E2',
            }}
            onPress={() => handleMenuPress(onLogoutPress)}
            activeOpacity={0.7}
          >
            <View style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 20,
              backgroundColor: '#FECACA',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon name="logout" size={24} color="#6B21A8" />
            </View>
            <Text style={{ marginLeft: 16, fontSize: 16, fontWeight: '600', color: '#DC2626' }}>
              Logout
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default React.memo(SideMenu);
