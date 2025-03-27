import { PermissionsAndroid, Platform, AppRegistry } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage, isSupported } from '@react-native-firebase/messaging';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

interface NotificationHandlerResponse {
  shouldShowAlert: boolean;
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
  priority: Notifications.AndroidNotificationPriority;
}

interface NotificationConfig {
  channelId: string;
  channelName: string;
  importance: Notifications.AndroidImportance;
}

type PopupNotification = {
  title: string;
  body: string;
  data?: Record<string, any>;
  android?: {
    channelId: string;
    priority: Notifications.AndroidNotificationPriority;
    sound?: boolean;
    vibrate?: number[];
    color?: string;
    smallIcon?: string;
  };
};

const DEFAULT_CONFIG: NotificationConfig = {
  channelId: 'popups',
  channelName: 'Popup Alerts',
  importance: Notifications.AndroidImportance.HIGH,
};

// Ensure Expo Notifications are handled correctly
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<NotificationHandlerResponse> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Modified showPopup to work with data-only messages
const showPopup = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> => {
  // Extract title and body from data payload, converting to string.
  const title: string = remoteMessage.data?.title ? String(remoteMessage.data.title) : '';
  const body: string = remoteMessage.data?.message ? String(remoteMessage.data.message) : '';

  // If no title and body, nothing to show.
  if (!title && !body) return;

  try {
    const notificationContent: PopupNotification = {
      title,
      body,
      data: remoteMessage.data ?? {},
      android: {
        channelId: DEFAULT_CONFIG.channelId,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sound: true,
        vibrate: [0, 250, 250, 250],
        color: '#FF231F7C',
        smallIcon: 'ic_notification',
      },
    };

    // Check for duplicate notifications using the messageId as identifier.
    const existingNotifications = await Notifications.getPresentedNotificationsAsync();
    if (existingNotifications.some((n) => n.request.identifier === remoteMessage.messageId)) {
      console.log('Skipping duplicate notification:', remoteMessage.messageId);
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Show immediately
      identifier: remoteMessage.messageId,
    });
  } catch (error) {
    console.error('Failed to show popup:', error);
  }
};

// Background message handler
const backgroundMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  if (remoteMessage.data?.suppressNotification === 'true') return;

  console.log('Handling background message:', remoteMessage);
  await showPopup(remoteMessage);
  return Promise.resolve();
};

// Register headless task immediately on module load
AppRegistry.registerHeadlessTask(
  'ReactNativeFirebaseMessagingHeadlessTask',
  () => backgroundMessageHandler
);

// Initialize Notifications & Prevent Duplicates
export const initializeNotifications = async () => {
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) return null;

    // Create/update notification channel
    await Notifications.setNotificationChannelAsync(DEFAULT_CONFIG.channelId, {
      name: DEFAULT_CONFIG.channelName,
      importance: DEFAULT_CONFIG.importance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
      enableLights: true,
      sound: 'default',
    });
    console.log('Notifications channel created:', DEFAULT_CONFIG.channelId);

    const app = getApp();
    const messagingInstance = getMessaging(app);

    // Ensure Firebase does NOT auto-show notifications
    await messagingInstance.setAutoInitEnabled(false);
    await messagingInstance.setDeliveryMetricsExportToBigQuery(false);

    const token = await messagingInstance.getToken();
    console.log('FCM Token:', token);

    // Set background message handler
    messagingInstance.setBackgroundMessageHandler(backgroundMessageHandler);

    // Foreground handler using modular API
    return onMessage(messagingInstance, async (remoteMessage) => {
      if (remoteMessage.data?.suppressNotification === 'true') return;

      console.log('Foreground message received:', remoteMessage);

      const existingNotifications = await Notifications.getPresentedNotificationsAsync();
      if (existingNotifications.some((n) => n.request.identifier === remoteMessage.messageId)) {
        console.log('Skipping duplicate foreground notification:', remoteMessage.messageId);
        return;
      }

      await showPopup(remoteMessage);
    });
  } catch (error) {
    console.error('Notification init error:', error);
    return null;
  }
};

// Request Permission for Notifications
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
