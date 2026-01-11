# Speech-to-Text AI Assistant

A full-stack application that allows users to interact with an AI assistant through speech. Users can speak into their microphone, and the system will:

1. Convert speech to text using Google Speech Recognition
2. Process the text through an LLM (Language Learning Model)
3. Convert the AI response back to speech using Google Text-to-Speech
4. Play the audio response to the user

## Architecture

- **Backend**: Flask (Python) with speech recognition and text-to-speech capabilities
- **Frontend**: React with Web Audio API for recording and playback
- **LLM Integration**: Configurable (currently set up for OpenAI, but can be customized)

## Features

- 🎤 Voice recording with visual feedback
- 🔊 Audio playback of AI responses
- 📝 Text display of both user input and AI responses
- 📚 Conversation history tracking
- 🔄 Real-time processing status
- 🧹 Easy conversation clearing
- ❌ Error handling and user feedback

## Prerequisites

### For Backend (Python/Flask):
- Python 3.8 or higher
- pip (Python package manager)

### For Frontend (React):
- Node.js 14 or higher
- npm or yarn

## Installation

### 1. Backend Setup

```bash
# Navigate to the project directory
cd D:\GID_MIG20\audio-in-out

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install
```

## Configuration

### LLM Integration (Optional)

The current implementation includes a simple echo response for testing. To integrate with an actual LLM:

1. **For OpenAI**: 
   - Uncomment the OpenAI code in `app.py`
   - Set your OpenAI API key as an environment variable:
     ```bash
     set OPENAI_API_KEY=your_api_key_here
     ```

2. **For other LLMs**: 
   - Modify the `get_llm_response()` function in `app.py`
   - Add the appropriate dependencies to `requirements.txt`

## Usage

### Starting the Backend

```bash
# From the project root directory
python app.py
```

The Flask server will start on `http://localhost:5000`

### Starting the Frontend

```bash
# From the frontend directory
cd frontend
npm start
```

The React app will start on `http://localhost:3000`

### Using the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Start Recording" to begin recording your voice
3. Speak your message clearly
4. Click "Stop Recording" to end the recording
5. Wait for the system to process your audio
6. The transcribed text and AI response will appear
7. The AI response will automatically play as audio
8. View conversation history and replay responses as needed

## System Requirements

### Audio Requirements:
- Microphone access (browser will request permission)
- Speakers or headphones for audio playback
- Modern web browser with Web Audio API support

### Browser Compatibility:
- Chrome 47+
- Firefox 55+
- Safari 11+
- Edge 79+

## Troubleshooting

### Common Issues:

1. **Microphone not working**:
   - Ensure your browser has microphone permissions
   - Check if other applications are using the microphone
   - Try refreshing the page and allowing permissions again

2. **Speech recognition errors**:
   - Speak clearly and avoid background noise
   - Ensure you have a stable internet connection (Google Speech Recognition requires internet)
   - Try speaking closer to the microphone

3. **Audio playback issues**:
   - Check your speaker/headphone connections
   - Ensure your browser allows audio autoplay
   - Try clicking the "Play Response" button manually

4. **CORS errors**:
   - Ensure both backend and frontend are running
   - Check that the Flask server is configured with CORS enabled

### Error Messages:

- **"Could not understand audio"**: The speech recognition couldn't process your audio. Try speaking more clearly.
- **"No audio file provided"**: The recording didn't capture properly. Try recording again.
- **"Speech recognition error"**: There was an issue with the Google Speech Recognition service.

## Development

### Project Structure

```
D:\GID_MIG20\audio-in-out\
├── app.py                 # Flask backend
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── temp_audio/           # Temporary audio files (created automatically)
└── frontend/
    ├── package.json      # Node.js dependencies
    ├── public/
    │   └── index.html    # HTML template
    └── src/
        ├── App.js        # Main React component
        ├── App.css       # App styling
        ├── index.js      # React entry point
        └── index.css     # Global styling
```

### Customization

- **Change AI Response Logic**: Modify the `get_llm_response()` function in `app.py`
- **Adjust UI Styling**: Edit `App.css` and `index.css` in the frontend
- **Add New Features**: Extend the React components and Flask routes as needed

## Security Notes

- The current implementation uses temporary files for audio processing
- Files are automatically cleaned up after 30 seconds
- For production use, consider implementing proper authentication and rate limiting
- Be mindful of API costs when using paid LLM services

## License

This project is for educational and development purposes. Please ensure you comply with the terms of service for any third-party APIs you integrate (Google Speech Recognition, OpenAI, etc.).

---

## Docker Deployment (Recommended for Production)

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+

### Quick Start with Docker

```bash
# 1. Ensure .env file exists with required variables
# GOOGLE_API_KEY, JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES, JWT_REFRESH_TOKEN_EXPIRES

# 2. Start the application (Windows)
docker.bat start

# Or on Linux/Mac
./docker.sh start

# 3. Access the application
# Frontend: http://localhost
# Backend: http://localhost:5000
```

### Docker Commands

**Windows:**
```batch
docker.bat start       # Start in production mode
docker.bat dev         # Start in development mode with hot reloading
docker.bat stop        # Stop all containers
docker.bat logs        # View logs
docker.bat backup      # Backup database
docker.bat status      # Show container status
```

**Linux/Mac:**
```bash
./docker.sh start      # Start in production mode
./docker.sh dev        # Start in development mode with hot reloading
./docker.sh stop       # Stop all containers
./docker.sh logs       # View logs
./docker.sh backup     # Backup database
./docker.sh status     # Show container status
```

For detailed Docker instructions, see [DOCKER_README.md](DOCKER_README.md)

---

## Quick Start Commands (Manual Installation)

### Option 1: Automated Setup (Recommended)
```powershell
# Run the setup script
.\setup_windows.bat

# Then run the startup script
powershell -ExecutionPolicy Bypass -File start.ps1
```

### Option 2: Manual Setup
```powershell
# Install FFmpeg (required for audio processing)
winget install "FFmpeg (Essentials Build)"

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd frontend
npm install
cd ..

# Terminal 1 - Start Backend
python app.py

# Terminal 2 - Start Frontend  
cd frontend
npm start
```

Then open `http://localhost:3000` in your browser and start talking to your AI assistant!

## Important Notes for Windows Users

- **FFmpeg**: Required for audio format conversion. Install using `winget install "FFmpeg (Essentials Build)"`
- **PyAudio**: Not required (removed from dependencies as we use browser's Web Audio API)
- **PowerShell**: Use PowerShell instead of Command Prompt for better compatibility
