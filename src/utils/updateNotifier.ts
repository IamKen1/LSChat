import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export const checkForUpdates = async () => {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      Alert.alert(
        'Update Available',
        'A new version is available. The app will now update.',
        [{ text: 'OK' }]
      );
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync(); 
    }
  } catch (error) {

  }
};