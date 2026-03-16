import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imselec.inversionapp',
  appName: 'InversionAPP',
  webDir: 'dist',
  // No server.url — loads bundled dist/ assets from APK directly (faster, works offline)
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
