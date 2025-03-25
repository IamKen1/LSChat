import * as Updates from 'expo-updates';
import { Alert } from 'react-native';

export const checkForUpdates = async () => {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      Alert.alert(
        'System Update Available',


        'A new version of the application is available. \n\n Would you like to install this update now?',        [{
          text: 'Update',
          onPress: async () => {
            try {
              await Updates.fetchUpdateAsync();
              Alert.alert(
                'Success',
                'Update downloaded. The app will now restart.',
                [
                  {
                    text: 'OK',
                    onPress: () => Updates.reloadAsync()
                  }
                ]
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to download update. Please try again later.'
              );

            }
          }
        },
        {
          text: 'Later',
          style: 'cancel'
        }
        ]
      );
    }
  } catch (error) {
    console.log('no update');

  }
};