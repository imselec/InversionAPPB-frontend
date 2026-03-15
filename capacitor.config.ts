import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imselec.inversionapp',
  appName: 'InversionAPP',
  webDir: 'dist',
  server: {
    // In development, point to local Vite server for live reload
    // Remove this block before building the final APK
    // url: 'http://10.0.2.2:5173',
    // cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
