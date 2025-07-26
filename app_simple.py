from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import speech_recognition as sr
from gtts import gTTS
import os
import uuid
import tempfile
import io
from datetime import datetime
import wave

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize speech recognizer
recognizer = sr.Recognizer()

# Create directories for temporary files
os.makedirs('temp_audio', exist_ok=True)

def get_llm_response(text):
    """
    Get response from LLM (placeholder for now)
    Replace this with your preferred LLM integration
    """
    # Simple echo response for testing
    return f"You said: {text}. This is a response from the AI assistant at {datetime.now().strftime('%H:%M:%S')}."

def convert_webm_to_wav(webm_data, output_path):
    """
    Simple conversion using wave library for basic formats
    """
    try:
        # Try to save as WAV directly
        with open(output_path, 'wb') as f:
            f.write(webm_data)
        
        # Test if it's readable by speech recognition
        with sr.AudioFile(output_path) as source:
            test_audio = recognizer.record(source, duration=0.1)
        
        return True
    except:
        return False

@app.route('/process-audio', methods=['POST'])
def process_audio():
    try:
        # Get audio file from request
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())
        temp_input_path = f'temp_audio/input_{unique_id}.wav'
        temp_output_path = f'temp_audio/output_{unique_id}.mp3'
        
        # Save the audio file
        audio_file.save(temp_input_path)
        
        print(f"Saved audio file: {temp_input_path}")
        print(f"File size: {os.path.getsize(temp_input_path)} bytes")
        
        # Try to process the audio directly
        try:
            with sr.AudioFile(temp_input_path) as source:
                # Adjust for ambient noise
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                # Record the audio
                audio_data = recognizer.record(source)
            
            print("Audio file read successfully")
            
        except Exception as e:
            print(f"Error reading audio file: {str(e)}")
            # Clean up and return error
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
            return jsonify({'error': f'Unable to process audio format: {str(e)}'}), 400
        
        # Recognize speech using Google Speech Recognition
        try:
            user_text = recognizer.recognize_google(audio_data)
            print(f"Recognized text: {user_text}")
        except sr.UnknownValueError:
            # Clean up
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
            return jsonify({'error': 'Could not understand audio. Please speak more clearly.'}), 400
        except sr.RequestError as e:
            # Clean up
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
            return jsonify({'error': f'Speech recognition service error: {str(e)}'}), 500
        
        # Get LLM response
        llm_response = get_llm_response(user_text)
        
        # Convert LLM response to speech
        try:
            tts = gTTS(text=llm_response, lang='en', slow=False)
            tts.save(temp_output_path)
            print(f"Generated TTS response: {temp_output_path}")
        except Exception as e:
            # Clean up
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
            return jsonify({'error': f'Text-to-speech error: {str(e)}'}), 500
        
        # Clean up input file
        if os.path.exists(temp_input_path):
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
    print("Starting Speech-to-Text AI Assistant...")
    print("Backend will be available at: http://localhost:5000")
    print("Make sure to start the React frontend at: http://localhost:3000")
    app.run(debug=True, host='0.0.0.0', port=5000)
