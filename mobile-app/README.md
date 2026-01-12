# Doctor Appointment Mobile App

A React Native Expo mobile application for booking doctor appointments with AI voice assistant capabilities.

## Features

- **User Authentication** - Login and registration with JWT tokens
- **Book Appointments** - Browse doctors and schedule appointments
- **My Appointments** - View and manage scheduled appointments
- **Voice Assistant** - Multilingual (English & Bengali) voice-enabled booking system
- **Real-time Updates** - Pull-to-refresh functionality
- **Responsive UI** - Clean, modern interface with smooth animations

## Prerequisites

Before running the app, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) - Install with `npm install -g expo-cli`
- [Expo Go](https://expo.dev/client) app on your mobile device (iOS or Android)

## Installation

1. Navigate to the mobile-app directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### API URL Configuration

Before running the app, you need to configure the API base URL in `src/constants/api.ts`:

- **For Android Emulator**: Use `http://10.0.2.2:5000`
- **For iOS Simulator**: Use `http://localhost:5000`
- **For Physical Device**: Use your computer's IP address (e.g., `http://192.168.1.X:5000`)

To find your computer's IP address:
- **Windows**: Run `ipconfig` in command prompt
- **Mac/Linux**: Run `ifconfig` in terminal

Update the `API_BASE_URL` in `src/constants/api.ts` accordingly.

## Running the App

1. Start the Expo development server:
   ```bash
   npm start
   ```

2. This will open Expo DevTools in your browser. You can then:
   - Scan the QR code with the Expo Go app (Android)
   - Scan the QR code with the Camera app (iOS)
   - Press `a` to open on Android emulator
   - Press `i` to open on iOS simulator

## Running on Emulator/Simulator

### Android Emulator
1. Install [Android Studio](https://developer.android.com/studio)
2. Set up an Android Virtual Device (AVD)
3. Start the emulator
4. Run:
   ```bash
   npm run android
   ```

### iOS Simulator (Mac only)
1. Install [Xcode](https://developer.apple.com/xcode/)
2. Run:
   ```bash
   npm run ios
   ```

## Project Structure

```
mobile-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── AppointmentCard.tsx
│   │   ├── DoctorCard.tsx
│   │   └── LoadingSpinner.tsx
│   ├── screens/          # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── BookAppointmentScreen.tsx
│   │   ├── MyAppointmentsScreen.tsx
│   │   └── VoiceAssistantScreen.tsx
│   ├── navigation/       # Navigation setup
│   │   ├── AuthStack.tsx
│   │   ├── MainTabs.tsx
│   │   └── RootNavigator.tsx
│   ├── context/          # Context providers
│   │   └── AuthContext.tsx
│   ├── services/         # API services
│   │   └── apiService.ts
│   ├── utils/            # Utility functions
│   │   ├── timeSlot.ts
│   │   └── validation.ts
│   └── constants/        # Constants and configuration
│       ├── api.ts
│       └── colors.ts
├── App.tsx              # Root component
├── package.json         # Dependencies
├── app.json            # Expo configuration
└── README.md           # This file
```

## Key Dependencies

- **expo** - Expo SDK
- **react-navigation** - Navigation library
- **axios** - HTTP client
- **expo-av** - Audio recording and playback
- **expo-speech** - Text-to-speech
- **@react-native-async-storage/async-storage** - Local storage
- **@react-native-community/datetimepicker** - Date picker

## API Endpoints

The app connects to the following backend endpoints:

- `POST /login` - User login
- `POST /register` - User registration
- `POST /refresh` - Token refresh
- `GET /doctors` - Get list of doctors
- `GET /appointments` - Get user appointments
- `POST /appointments` - Book appointment
- `DELETE /appointments/:id` - Cancel appointment
- `POST /process-audio` - Process voice recording
- `GET /get-audio/:id` - Get audio response
- `DELETE /cleanup/:id` - Cleanup audio files

## Features in Detail

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure storage with AsyncStorage
- Form validation

### Appointment Booking
- Browse available doctors
- Select appointment date
- View doctor specializations and availability
- Real-time feedback on booking status

### My Appointments
- View all scheduled appointments
- Cancel appointments with confirmation
- Pull-to-refresh functionality
- Empty state handling

### Voice Assistant
- Record voice commands
- Multilingual support (English & Bengali)
- Real-time transcription
- AI-powered responses
- Text-to-speech playback
- Conversation history

## Permissions

The app requires the following permissions:

- **Microphone** - For voice assistant functionality
- **Speech Recognition** - For processing voice commands

These permissions are requested at runtime when accessing the Voice Assistant feature.

## Troubleshooting

### Common Issues

1. **"Network request failed"**
   - Check if the backend server is running
   - Verify the API_BASE_URL is correct for your device
   - Ensure your device/emulator can reach the backend server

2. **"Unable to resolve module"**
   - Clear the cache: `expo start -c`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Audio recording not working**
   - Ensure microphone permissions are granted
   - Test on a physical device (not emulator)
   - Check that expo-av is properly installed

4. **Date picker not showing on Android**
   - Ensure @react-native-community/datetimepicker is properly installed
   - Check Android permissions in app.json

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.
