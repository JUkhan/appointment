# Quick Fix for Audio Format Issue

The error you're seeing is because the browser's audio format (WebM) isn't compatible with Python's SpeechRecognition library. Here's how to fix it:

## Option 1: Install FFmpeg Properly (Recommended)

1. **Download FFmpeg for Windows:**
   - Go to https://www.gyan.dev/ffmpeg/builds/
   - Download the "release builds" zip file
   - Extract it to `C:\ffmpeg`

2. **Add FFmpeg to PATH:**
   ```powershell
   # Add to your PowerShell profile or run each time
   $env:PATH += ";C:\ffmpeg\bin"
   
   # Or permanently add to system PATH:
   # Open System Properties > Environment Variables
   # Edit the PATH variable and add: C:\ffmpeg\bin
   ```

3. **Verify installation:**
   ```powershell
   ffmpeg -version
   ```

4. **Restart your terminal and run:**
   ```powershell
   python app.py
   ```

## Option 2: Manual FFmpeg Installation

1. **Download and extract FFmpeg to a folder**
2. **Update the Flask app to point to FFmpeg directly:**

Add this to the top of `app.py` after the imports:

```python
# Configure FFmpeg path manually
import os
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\bin"  # Update this path

# Or set it directly for pydub
from pydub import AudioSegment
AudioSegment.converter = r"C:\ffmpeg\bin\ffmpeg.exe"
AudioSegment.ffmpeg = r"C:\ffmpeg\bin\ffmpeg.exe"
AudioSegment.ffprobe = r"C:\ffmpeg\bin\ffprobe.exe"
```

## Option 3: Use Web Speech API (Browser-based)

If FFmpeg continues to cause issues, you can modify the React frontend to use the browser's built-in speech recognition:

1. Replace the current implementation with Web Speech API
2. This would eliminate the need for server-side speech processing
3. But it only works in Chrome/Edge and requires internet connection

## Current Issue

The error occurs because:
- Browser records audio in WebM format
- Python SpeechRecognition library expects WAV/FLAC
- FFmpeg is needed to convert between formats
- Our FFmpeg installation didn't complete properly

## Quick Test

Try this command to see if FFmpeg is accessible:
```powershell
where ffmpeg
```

If it returns nothing, FFmpeg isn't in your PATH and needs to be installed properly.

## Alternative: Use a Different Browser Recording Format

You can also try modifying the React frontend to record in a different format, but browser support varies.
