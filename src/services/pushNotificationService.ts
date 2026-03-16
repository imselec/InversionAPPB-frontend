import { Capacitor } from '@capacitor/core';
import { post } from './apiClient';

/**
 * Push notification registration.
 * Requires Firebase (google-services.json) to be configured.
 * Currently a no-op until Firebase is set up.
 */
export async function registerPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  // Firebase not configured yet — push notifications disabled
  console.info('Push notifications require Firebase setup (google-services.json)');
}

/**
 * Unregisters the device from push notifications.
 */
export async function unregisterPushNotifications(token: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await post('/notifications/unregister', { device_token: token });
  } catch (err) {
    console.error('Failed to unregister device token:', err);
  }
}
