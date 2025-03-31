import { PermissionsAndroid, Platform } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

// Types for notification handling
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

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<NotificationHandlerResponse> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Show local notifications from anywhere in the app
export const showLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | null> => {
  try {
    const notificationContent: PopupNotification = {
      title,
      body,
      data: data ?? {},
      android: {
        channelId: DEFAULT_CONFIG.channelId,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sound: true,
        vibrate: [0, 250, 250, 250],
        color: '#FF231F7C',
        smallIcon: 'ic_notification',
      },
    };

    const identifier = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
      identifier,
    });
    
    return identifier;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return null;
  }
};

// Display notifications from Firebase data messages
const showPopup = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> => {
  const title: string = remoteMessage.data?.title ? String(remoteMessage.data.title) : '';
  const body: string = remoteMessage.data?.message ? String(remoteMessage.data.message) : '';

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

    const existingNotifications = await Notifications.getPresentedNotificationsAsync();
    if (existingNotifications.some((n) => n.request.identifier === remoteMessage.messageId)) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
      identifier: remoteMessage.messageId,
    });
  } catch (error) {
    console.error('Failed to show popup:', error);
  }
};

// Background message handler
export const backgroundMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  if (remoteMessage.data?.suppressNotification === 'true') return;
  await showPopup(remoteMessage);
  return Promise.resolve();
};

// Initialize notifications system
export const initializeNotifications = async () => {
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) return null;

    await Notifications.setNotificationChannelAsync(DEFAULT_CONFIG.channelId, {
      name: DEFAULT_CONFIG.channelName,
      importance: DEFAULT_CONFIG.importance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      enableVibrate: true,
      enableLights: true,
      sound: 'default',
    });

    const app = getApp();
    const messagingInstance = getMessaging(app);
    await messagingInstance.setAutoInitEnabled(false);
    await messagingInstance.setDeliveryMetricsExportToBigQuery(false);

    if (Platform.OS === 'android') {
      messagingInstance.setBackgroundMessageHandler(backgroundMessageHandler);
    }

    return onMessage(messagingInstance, async (remoteMessage) => {
      if (remoteMessage.data?.suppressNotification === 'true') return;
      
      const existingNotifications = await Notifications.getPresentedNotificationsAsync();
      if (existingNotifications.some((n) => n.request.identifier === remoteMessage.messageId)) {
        return;
      }

      await showPopup(remoteMessage);
    });
  } catch (error) {
    console.error('Notification init error:', error);
    return null;
  }
};

// Request notification permissions
const requestUserPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};
