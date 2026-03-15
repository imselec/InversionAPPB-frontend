import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imselec.inversionapp',
  appName: 'InversionAPP',
  webDir: 'dist',
  server: {
    // Loads the deployed frontend directly — no need to bundle dist/ in the APK
    url: 'https://inversionappb-frontend.onrender.com',
    cleartext: false,
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
