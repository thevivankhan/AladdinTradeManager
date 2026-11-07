import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aladdin.sniper',
  appName: 'Aladdin Sniper',
  webDir: 'dist',
  server: {
    url: 'https://ais-pre-s5tkdvr5qtvgbfaq3cwndx-45070477227.asia-southeast1.run.app',
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '*.run.app',
      '*.po.life',
      '*.pocketoption.com',
      '*.pocket-friends.co',
      '*.po.trade',
      '*.po8.cash',
      'telegram.dog',
      '*.telegram.dog',
      'is.gd',
      'tinyurl.com',
      't.me',
      '*.t.me'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
