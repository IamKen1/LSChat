import { AppRegistry } from 'react-native';
import { backgroundMessageHandler } from './useNotification';

/**
 * This module should be imported ONCE at app startup to register the headless task
 */

// Use module-level variable to ensure the function is only called once per JS context
let isRegistered = false;

export default function registerFirebaseHeadlessTask() {
  if (isRegistered) return;

  try {
    AppRegistry.registerHeadlessTask(
      'ReactNativeFirebaseMessagingHeadlessTask',
      () => backgroundMessageHandler
    );
    isRegistered = true;
  } catch (error) {
    console.error('[Firebase] Failed to register headless task:', error);
  }
}
