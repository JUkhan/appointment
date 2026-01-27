# Quick Start Guide

## Start the Ionic App (Web)

### Option 1: Using Ionic CLI
```bash
ionic serve
```

### Option 2: Using npm
```bash
npm run dev
```

The app will open automatically in your browser, typically at http://localhost:5173

## Important: Backend Must Be Running

The app needs the backend API to function. Make sure your backend is running on http://localhost:5000

If your backend is on a different port or address, update `src/constants/api.ts`

## Default Test Credentials

If you don't have an account yet:
1. Click "Register" on the login page
2. Create a new account (username: min 3 chars, password: min 6 chars)
3. Login with your new credentials

## Main Features to Test

### 1. Book Appointment Tab
- Search for doctors
- Select a doctor
- Choose a date
- Enter patient details
- Book appointment

### 2. Appointments Tab
- View your appointments
- Pull down to refresh
- Swipe left on appointment to cancel
- Confirm cancellation

### 3. Assistant Tab
- Toggle language (English/Bengali)
- Press microphone button to record
- Speak your question
- View AI response
- Listen to text-to-speech (may require permission)

## Troubleshooting

### Can't connect to backend?
```bash
# Check if backend is running
curl http://localhost:5000/doctors
```

### Port already in use?
Kill the process using that port or use a different port:
```bash
ionic serve --port 5174
```

### Microphone not working?
Allow microphone access in your browser settings

### App won't start?
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Try again
ionic serve
```

## Build for Production

### Web Build
```bash
npm run build
```
Output will be in `dist/` directory

### Android Build
```bash
npx cap add android
npx cap sync android
npx cap open android
```
Then build from Android Studio

### iOS Build (macOS only)
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```
Then build from Xcode

## Need Help?

- See `README.md` for detailed documentation
- See `IMPLEMENTATION_SUMMARY.md` for technical details
- Check browser console for errors (F12)

## Quick Commands

```bash
# Development
ionic serve                 # Start dev server
npm run build              # Production build
ionic info                 # Show environment info

# Native
npx cap sync              # Sync web assets to native
npx cap open android      # Open in Android Studio
npx cap open ios          # Open in Xcode

# Debugging
ionic serve --lab        # iOS and Android side-by-side
ionic serve --clear      # Clear cache
```

## Environment Variables

Create `.env` file in root if needed:
```env
VITE_API_URL=https://your-api-url.com
```

Default URLs (auto-configured):
- Web dev: http://localhost:5000
- Native dev: http://192.168.43.192:5000

---

**Happy Testing! 🚀**
