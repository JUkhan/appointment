from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import speech_recognition as sr
from gtts import gTTS
import os
import uuid
import tempfile
import io
from pydub import AudioSegment
from pydub.utils import which
from datetime import datetime
import wave
import subprocess
import shutil

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize speech recognizer
recognizer = sr.Recognizer()

# Configure OpenAI (you'll need to set your API key)
# openai.api_key = os.getenv('OPENAI_API_KEY')

# Create directories for temporary files
os.makedirs('temp_audio', exist_ok=True)

# Configure ffmpeg path for pydub
def setup_ffmpeg():
    """Find and configure ffmpeg for pydub"""
    # Local ffmpeg installation (downloaded directly)
    local_ffmpeg_dir = os.path.join(os.getcwd(), "ffmpeg-7.1.1-essentials_build", "bin")
    local_ffmpeg_path = os.path.join(local_ffmpeg_dir, "ffmpeg.exe")
    local_ffprobe_path = os.path.join(local_ffmpeg_dir, "ffprobe.exe")
    
    # Common ffmpeg installation paths on Windows
    possible_paths = [
        (local_ffmpeg_path, local_ffprobe_path),  # Try local installation first
        (r"C:\ffmpeg\bin\ffmpeg.exe", r"C:\ffmpeg\bin\ffprobe.exe"),
        (r"C:\Program Files\ffmpeg\bin\ffmpeg.exe", r"C:\Program Files\ffmpeg\bin\ffprobe.exe"),
        (r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe", r"C:\Program Files (x86)\ffmpeg\bin\ffprobe.exe"),
    ]
    
    for ffmpeg_path, ffprobe_path in possible_paths:
        if os.path.exists(ffmpeg_path) and os.path.exists(ffprobe_path):
            # Set environment variables for pydub
            os.environ['PATH'] = os.path.dirname(ffmpeg_path) + os.pathsep + os.environ.get('PATH', '')
            
            # Configure pydub directly
            AudioSegment.converter = ffmpeg_path
            AudioSegment.ffmpeg = ffmpeg_path
            AudioSegment.ffprobe = ffprobe_path
            
            print(f"✅ Found ffmpeg at: {ffmpeg_path}")
            print(f"✅ Found ffprobe at: {ffprobe_path}")
            
            # Test the configuration
            try:
                result = subprocess.run([ffmpeg_path, "-version"], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    print("✅ FFmpeg is working correctly")
                    return True
            except Exception as e:
                print(f"⚠️ FFmpeg test failed: {e}")
    
    # Try system PATH as fallback
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("✅ Using ffmpeg from system PATH")
            return True
    except Exception:
        pass
    
    print("❌ Warning: ffmpeg not found. Audio conversion may fail.")
    return False

# Setup ffmpeg on startup
setup_ffmpeg()

# Language configuration
LANGUAGE_CONFIG = {
    'en': {
        'name': 'English',
        'speech_code': 'en-US',
        'tts_code': 'en',
        'echo_template': "You said: {text}. This is a response from the AI assistant at {time}."
    },
    'bn': {
        'name': 'Bengali',
        'speech_code': 'bn-BD',
        'tts_code': 'bn',
        'echo_template': "আপনি বলেছেন: {text}। এটি AI সহায়কের প্রতিক্রিয়া, সময়: {time}।"
    }
}

def get_llm_response(text, language='en'):
    """
    Get response from LLM (placeholder for now)
    Replace this with your preferred LLM integration
    """
    # Simple echo response for testing
    lang_config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG['en'])
    time_str = datetime.now().strftime('%H:%M:%S')
    
    return lang_config['echo_template'].format(text=text, time=time_str)
    
    # Uncomment below for OpenAI integration:
    # try:
    #     response = openai.chat.completions.create(
    #         model="gpt-3.5-turbo",
    #         messages=[
    #             {"role": "system", "content": "You are a helpful assistant."},
    #             {"role": "user", "content": text}
    #         ]
    #     )
    #     return response.choices[0].message.content
    # except Exception as e:
    #     return f"Sorry, I couldn't process your request: {str(e)}"

@app.route('/process-audio', methods=['POST'])
def process_audio():
    try:
        # Get audio file and language from request
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        language = request.form.get('language', 'en')  # Default to English
        
        # Validate language
        if language not in LANGUAGE_CONFIG:
            language = 'en'  # Fallback to English
        
        lang_config = LANGUAGE_CONFIG[language]
        print(f"Processing audio in {lang_config['name']} language")
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())
        temp_input_path = f'temp_audio/input_{unique_id}.wav'
        temp_output_path = f'temp_audio/output_{unique_id}.mp3'
        
        # Convert and save uploaded audio file to WAV format
        try:
            # First try direct save (for WebM/WAV files from browser)
            audio_file.save(temp_input_path)
            
            # Try to read it directly with speech recognition
            try:
                with sr.AudioFile(temp_input_path) as test_source:
                    test_audio = recognizer.record(test_source, duration=0.1)
                print("Audio file is compatible, no conversion needed")
            except:
                # If direct read fails, try pydub conversion
                print("Attempting audio format conversion...")
                audio_file.seek(0)  # Reset file pointer
                audio_segment = AudioSegment.from_file(audio_file)
                # Ensure proper format for speech recognition
                audio_segment = audio_segment.set_frame_rate(16000).set_channels(1)
                audio_segment.export(temp_input_path, format='wav')
                print("Audio converted successfully")
                
        except Exception as e:
            # Fallback: try to save the file as-is and hope it works
            try:
                audio_file.seek(0)
                audio_file.save(temp_input_path)
                print(f"Audio conversion failed, trying direct processing: {str(e)}")
            except Exception as e2:
                return jsonify({'error': f'Audio processing failed: {str(e)} | Fallback failed: {str(e2)}'}), 400
        
        # Convert audio to text using speech recognition
        with sr.AudioFile(temp_input_path) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source)
            # Record the audio
            audio_data = recognizer.record(source)
        
        # Recognize speech using Google Speech Recognition
        try:
            user_text = recognizer.recognize_google(audio_data, language=lang_config['speech_code'])
            print(f"Recognized text: {user_text}")
        except sr.UnknownValueError:
            return jsonify({'error': 'Could not understand audio'}), 400
        except sr.RequestError as e:
            return jsonify({'error': f'Speech recognition error: {str(e)}'}), 500
        print('user text: ', user_text)
        # Get LLM response
        llm_response = get_llm_response(user_text, language)
        
        # Convert LLM response to speech
        tts = gTTS(text=llm_response, lang=lang_config['tts_code'], slow=False)
        tts.save(temp_output_path)
        
        # Clean up input file
        os.remove(temp_input_path)
        
        return jsonify({
            'user_text': user_text,
            'llm_response': llm_response,
            'audio_id': unique_id
        })
        
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

@app.route('/get-audio/<audio_id>', methods=['GET'])
def get_audio(audio_id):
    try:
        audio_path = f'temp_audio/output_{audio_id}.mp3'
        if os.path.exists(audio_path):
            def remove_file():
                try:
                    os.remove(audio_path)
                except:
                    pass
            
            # Schedule file removal after sending
            return send_file(audio_path, as_attachment=True, download_name='response.mp3', mimetype='audio/mpeg')
        else:
            return jsonify({'error': 'Audio file not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Error retrieving audio: {str(e)}'}), 500

@app.route('/cleanup/<audio_id>', methods=['DELETE'])
def cleanup_audio(audio_id):
    try:
        audio_path = f'temp_audio/output_{audio_id}.mp3'
        if os.path.exists(audio_path):
            os.remove(audio_path)
        return jsonify({'message': 'File cleaned up successfully'})
    except Exception as e:
        return jsonify({'error': f'Cleanup error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Speech-to-text service is running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
