/**
 * This file is imported directly in the app's entry point (index.js)
 * It registers the Firebase headless task ONCE when the app starts
 * DO NOT IMPORT THIS FILE ANYWHERE ELSE
 */

import { AppRegistry, Platform } from 'react-native';

// Simple handler for initial registration
const initialHandler = async (message: any) => {
  return Promise.resolve();
};

// Register headless task once on app startup (Android only)
if (Platform.OS === 'android') {
  try {
    AppRegistry.registerHeadlessTask(
      'ReactNativeFirebaseMessagingHeadlessTask', 
      () => initialHandler
    );
  } catch (error) {
    console.error('[Firebase] Registration error:', error);
  }
}

// @ts-ignore
global.headlessTaskRegisteredAtStartup = true;
