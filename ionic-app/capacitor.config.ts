import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medicare.app',
  appName: 'MediCare',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  },
  plugins: {
    VoiceRecorder: {
      permissions: {
        microphone: 'This app needs microphone access to record voice messages for the AI assistant'
      }
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0ea5e9',
      showSpinner: true,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff'
    }
  }
};

export default config;
