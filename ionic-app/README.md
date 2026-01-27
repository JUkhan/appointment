# Doc Appointment - Ionic React Application

A comprehensive doctor appointment booking application built with Ionic Framework v8 and React.js.

## Features

### Authentication
- User login and registration
- Token-based authentication with auto-refresh
- Persistent authentication state using Capacitor Storage

### Appointment Management
- Browse and search doctors by name or specialization
- Book appointments with date selection
- View all user appointments
- Cancel appointments with confirmation
- Pull-to-refresh appointments list

### Voice Assistant
- Audio recording via Capacitor Voice Recorder
- Speech-to-text processing via backend API
- AI-powered responses from LLM
- Text-to-speech with language toggle (English/Bengali)
- Chat-like message display with markdown rendering

## Tech Stack

- **Framework**: Ionic Framework v8
- **UI Library**: React.js with TypeScript
- **Routing**: React Router + Ionic Router
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Storage**: Capacitor Preferences
- **Voice Recording**: capacitor-voice-recorder
- **Text-to-Speech**: @capacitor-community/text-to-speech
- **Markdown**: react-markdown + remark-gfm
- **Date Handling**: date-fns

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Ionic CLI (`npm install -g @ionic/cli`)
- For native builds:
  - Android Studio (for Android)
  - Xcode (for iOS)

## Installation

1. Install dependencies:
```bash
cd ionic-app
npm install
```

2. (Optional) Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your production API URL if needed
```

## Development

### Web Development
Start the development server:
```bash
ionic serve
```
or
```bash
npm run dev
```

The app will open at `http://localhost:5173` (or similar port).

**Note**: For web development, the API base URL is automatically set to `http://localhost:5000`. Make sure your backend is running on this port.

### Native Development

#### Android

1. Add Android platform:
```bash
npx cap add android
```

2. Sync changes:
```bash
npx cap sync android
```

3. Open in Android Studio:
```bash
npx cap open android
```

4. Build and run from Android Studio

**Note**: For Android, the API base URL is automatically set to `http://192.168.43.192:5000` (your local network IP). Update `src/constants/api.ts` if your backend is on a different IP.

#### iOS

1. Add iOS platform (macOS only):
```bash
npx cap add ios
```

2. Sync changes:
```bash
npx cap sync ios
```

3. Open in Xcode:
```bash
npx cap open ios
```

4. Build and run from Xcode

## Project Structure

```
ionic-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AppointmentCard.tsx
│   │   ├── DoctorCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/             # React Context providers
│   │   └── AuthContext.tsx
│   ├── pages/               # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── BookAppointmentPage.tsx
│   │   ├── MyAppointmentsPage.tsx
│   │   └── VoiceAssistantPage.tsx
│   ├── services/            # API and storage services
│   │   ├── apiService.ts
│   │   └── storageService.ts
│   ├── constants/           # Configuration constants
│   │   └── api.ts
│   ├── utils/               # Utility functions
│   │   ├── validation.ts
│   │   ├── dateFormat.ts
│   │   └── markdown.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── theme/               # Ionic theme configuration
│   │   └── variables.css
│   ├── App.tsx              # Main app component with routing
│   └── main.tsx             # App entry point
├── capacitor.config.ts      # Capacitor configuration
├── package.json
└── README.md
```

## API Configuration

The app automatically configures the API base URL based on the platform and environment:

- **Web (development)**: `http://localhost:5000`
- **Native (development)**: `http://192.168.43.192:5000`
- **Production**: Set via `VITE_API_URL` environment variable

To change the API URL:
1. Update `src/constants/api.ts`
2. Or set `VITE_API_URL` in `.env` file for production

## Backend API Endpoints

The app expects the following API endpoints to be available:

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `POST /refresh` - Refresh access token

### Doctors
- `GET /doctors` - Get all doctors

### Appointments
- `GET /appointments` - Get user appointments
- `POST /appointments` - Create appointment
- `DELETE /appointments/{id}` - Cancel appointment

### Voice Assistant
- `POST /process-audio` - Process audio recording
- `POST /process-text` - Process text message
- `GET /get-audio/{id}` - Get audio file
- `DELETE /cleanup/{id}` - Cleanup audio file

## Building for Production

### Web
```bash
npm run build
```
The built files will be in the `dist/` directory.

### Android APK
1. Sync and open in Android Studio
2. Build > Build Bundle(s) / APK(s) > Build APK(s)

### iOS IPA
1. Sync and open in Xcode
2. Product > Archive
3. Distribute App

## Features by Page

### Login Page (`/login`)
- Username and password inputs
- Form validation
- Error handling with toast messages
- Link to registration page

### Register Page (`/register`)
- Username, password, and confirm password inputs
- Password matching validation
- Success/error feedback
- Auto-redirect to login on success

### Book Appointment Page (`/tabs/book`)
- Search doctors by name or specialization
- View doctor cards with details
- Select doctor
- Date picker modal
- Patient information form
- Appointment creation with validation

### My Appointments Page (`/tabs/appointments`)
- List of user appointments
- Pull-to-refresh functionality
- Swipe-to-delete gesture
- Cancel confirmation alert
- Empty state when no appointments

### Voice Assistant Page (`/tabs/assistant`)
- Language toggle (English/Bengali)
- Record button (FAB)
- Recording duration display
- Message history (user and assistant)
- Markdown rendering for assistant responses
- Text-to-speech playback
- Auto-scroll to latest message

## Permissions

The app requires the following permissions:

### Android
- `android.permission.RECORD_AUDIO` - For voice recording
- `android.permission.INTERNET` - For API communication

### iOS
- `NSMicrophoneUsageDescription` - For voice recording

These are configured in `capacitor.config.ts` and will be automatically added to native projects.

## Troubleshooting

### Issue: API calls failing
- Check if backend is running
- Verify API base URL in `src/constants/api.ts`
- Check network connectivity

### Issue: Voice recording not working
- Ensure microphone permissions are granted
- Check browser/device microphone access
- Verify capacitor-voice-recorder plugin is installed

### Issue: Text-to-speech not working
- Check if TTS service is available on device
- Verify language support (en-US, bn-BD)
- Check audio output settings

### Issue: Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Ionic cache: `ionic serve --clear`
- Sync Capacitor: `npx cap sync`

## Development Tips

1. **Hot Reload**: Use `ionic serve` for instant updates during development
2. **Debugging**: Use browser DevTools for web, and native IDE debuggers for mobile
3. **API Testing**: Test API endpoints separately before integrating
4. **Responsive Design**: Ionic components are responsive by default
5. **Dark Mode**: The app supports system dark mode automatically

## Known Limitations

- Voice recording format may vary by platform (WebM for web, M4A for iOS)
- Bengali TTS quality depends on device TTS engine
- Large audio files may take time to process
- Token refresh requires valid refresh token

## Future Enhancements

- [ ] Push notifications for appointment reminders
- [ ] In-app messaging with doctor
- [ ] Medical history tracking
- [ ] Prescription management
- [ ] Payment integration
- [ ] Multi-language support (beyond English/Bengali)
- [ ] Offline mode with data sync

## License

This project is part of the doc-appointment system.

## Support

For issues and questions, please refer to the main project documentation.
