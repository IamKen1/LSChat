import { PermissionsAndroid, Platform } from 'react-native';
import { getMessaging, getToken as getMessagingToken } from '@react-native-firebase/messaging';
import { getApp } from '@react-native-firebase/app';
import * as Notifications from 'expo-notifications';

export const initializeNotifications = async () => {
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return;
    }

    await getFirebaseToken();

    const messaging = getMessaging(getApp());

    // Handle background notifications
    messaging.setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Handle foreground notifications
    const unsubscribe = messaging.onMessage(async remoteMessage => {
      console.log('Message received in the foreground!', remoteMessage);

      if (remoteMessage.notification) {
        // Explicitly display the notification in the status bar
        await Notifications.presentNotificationAsync({
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          data: remoteMessage.data,
        });
      }
    });

    return unsubscribe; // Return the unsubscribe function to clean up the listener
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
  }
};

const requestUserPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
        return true;
      }
      console.log('Notification permission denied');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

const getFirebaseToken = async () => {
  try {
    const messaging = getMessaging(getApp());
    const currentToken = await getMessagingToken(messaging);

    if (!currentToken) {
      console.log('No FCM token available');
      return null;
    }

    console.log('FCM token:', currentToken);
    return currentToken;
  } catch (error: unknown) {
    if ((error as Error).message?.includes('SERVICE_NOT_AVAILABLE')) {
      console.error('FCM service not available. Check internet connection and Google Play Services.');
    } else {
      console.error('Failed to get FCM token:', error);
    }
    return null;
  }
};