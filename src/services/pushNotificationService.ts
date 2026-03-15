import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { post } from './apiClient';

export interface PushRegistration {
  token: string;
  platform: 'android' | 'ios' | 'web';
}

/**
 * Registers the device for push notifications via FCM.
 * Only runs on native Android/iOS — no-op on web.
 */
export async function registerPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Request permission
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') {
    console.warn('Push notification permission denied');
    return;
  }

  // Register with FCM
  await PushNotifications.register();

  // Handle FCM token received
  PushNotifications.addListener('registration', async (token) => {
    console.log('FCM token:', token.value);
    try {
      await post('/notifications/register', {
        device_token: token.value,
        platform: Capacitor.getPlatform(),
      });
    } catch (err) {
      console.error('Failed to register device token with backend:', err);
    }
  });

  // Handle registration errors
  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err);
  });

  // Handle foreground notifications
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received in foreground:', notification);
    // You can show an in-app toast here if desired
  });

  // Handle notification tap (app opened from notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Notification tapped:', action.notification);
    // Navigate to relevant screen based on notification data
    const data = action.notification.data as Record<string, string> | undefined;
    if (data?.route) {
      window.location.hash = data.route;
    }
  });
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
