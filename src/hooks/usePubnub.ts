import { useState, useEffect } from 'react';
import PubNub from 'pubnub';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUBNUB_PUBLISH_KEY, PUBNUB_SUBSCRIBE_KEY } from '../../config';

interface UsePubnubOptions {
  channels?: string[];
  withPresence?: boolean;
  autoInitialize?: boolean;
}

interface UsePubnubResult {
  pubnub: PubNub | null;
  isInitialized: boolean;
  error: Error | null;
  userId: string | null;
  initialize: () => Promise<PubNub | null>;
  subscribe: (channelList: string[]) => void;
  unsubscribe: (channelList?: string[]) => void;
  publish: (channel: string, message: any) => Promise<void>;
}

export const usePubnub = ({
  channels = [],
  withPresence = false,
  autoInitialize = true,
}: UsePubnubOptions = {}): UsePubnubResult => {
  const [pubnub, setPubnub] = useState<PubNub | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = async (): Promise<PubNub | null> => {
    try {
      const userData = JSON.parse(await AsyncStorage.getItem('userSession') || '{}');
      if (!userData.user || !userData.user.user_id) {
        throw new Error('User not authenticated');
      }

      const userId = String(userData.user.user_id);
      setUserId(userId);

      const pubnubInstance = new PubNub({
        publishKey: PUBNUB_PUBLISH_KEY,
        subscribeKey: PUBNUB_SUBSCRIBE_KEY,
        userId,
      });

      setPubnub(pubnubInstance);
      setIsInitialized(true);

      if (channels.length > 0) {
        pubnubInstance.subscribe({
          channels,
          withPresence,
        });
      }

      return pubnubInstance;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize PubNub');
      setError(error);
      console.error('PubNub initialization error:', error);
      return null;
    }
  };

  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }

    return () => {
      if (pubnub && channels.length > 0) {
        pubnub.unsubscribe({
          channels,
        });
      }
    };
  }, []);

  const subscribe = (channelList: string[]) => {
    if (!pubnub || !channelList.length) return;
    
    pubnub.subscribe({
      channels: channelList,
      withPresence,
    });
  };

  const unsubscribe = (channelList?: string[]) => {
    if (!pubnub) return;
    
    pubnub.unsubscribe({
      channels: channelList || channels,
    });
  };

  const publish = async (channel: string, message: any): Promise<void> => {
    if (!pubnub) {
      throw new Error('PubNub not initialized');
    }

    try {
      await pubnub.publish({
        channel,
        message,
      });
    } catch (err) {
      console.error('Error publishing message:', err);
      throw err;
    }
  };

  return {
    pubnub,
    isInitialized,
    error,
    userId,
    initialize,
    subscribe,
    unsubscribe,
    publish,
  };
};

export default usePubnub;
