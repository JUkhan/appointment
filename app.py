from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
#from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
#from gtts import gTTS
import speech_recognition as sr
#import edge_tts
#import asyncio
import os
import uuid
#import tempfile
#import io
from pydub import AudioSegment
from pydub.utils import which
from datetime import datetime, timedelta
#import wave
import subprocess
#import shutil
from dotenv import load_dotenv
from db import db
from models import User, Doctor, Appointment
from tts import gen_audio_file

load_dotenv()
from agent.app import run_chatbot2


app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///appointment_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
# Comprehensive JWT configuration to disable CSRF
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_CSRF_PROTECT'] = False
app.config['JWT_CSRF_IN_COOKIES'] = False
app.config['JWT_CSRF_CHECK_FORM'] = False
app.config['JWT_COOKIE_CSRF_PROTECT'] = False

# Initialize extensions
#db = SQLAlchemy(app)
db.init_app(app)
jwt = JWTManager(app)

# JWT Error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 422

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({'error': 'Authorization token is required'}), 422


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
#setup_ffmpeg()

# Language configuration
LANGUAGE_CONFIG = {
    'en': {
        'name': 'English',
        'speech_code': 'en-US',
        'tts_voice': 'en-US-AriaNeural',
        'tts_code': 'en',
        'echo_template': "You said: {text}. This is a response from the AI assistant at {time}."
    },
    'bn': {
        'name': 'Bengali',
        'speech_code': 'bn-BD',
        'tts_voice': 'bn-BD-NabanitaNeural',
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
    
    

@app.route('/api/chatbot', methods=['POST'])
def chat():
    user_input = request.json.get('user_input')
    thread_id = request.json.get('thread_id')
    if not user_input:
        return jsonify({"error": "user_input is required"}), 400
    
    response = run_chatbot(user_input, thread_id)
    return jsonify({"response": response})

@app.route('/process-audio', methods=['POST'])
@jwt_required()
def process_audio():
    temp_input_path = None
    temp_output_path = None

    try:
        print('-------------enter process audio---------------')
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        language = request.form.get('language', 'en')

        if language not in LANGUAGE_CONFIG:
            language = 'en'

        lang_config = LANGUAGE_CONFIG[language]
        print(f"Processing audio in {lang_config['name']} language")

        unique_id = str(uuid.uuid4())
        temp_input_path = f'temp_audio/input_{unique_id}.wav'
        temp_output_path = f'temp_audio/output_{unique_id}.mp3'

        # Convert and save uploaded audio file to WAV format
        try:
            audio_file.save(temp_input_path)

            try:
                with sr.AudioFile(temp_input_path) as test_source:
                    pass  # Just test if readable
                print("Audio file is compatible, no conversion needed")
            except:
                print("Attempting audio format conversion...")
                audio_file.seek(0)
                audio_segment = AudioSegment.from_file(audio_file)
                audio_segment = audio_segment.set_frame_rate(16000).set_channels(1)
                audio_segment.export(temp_input_path, format='wav')
                print("Audio converted successfully")

        except Exception as e:
            try:
                audio_file.seek(0)
                audio_file.save(temp_input_path)
                print(f"Audio conversion failed, trying direct processing: {str(e)}")
            except Exception as e2:
                return jsonify({'error': f'Audio processing failed: {str(e)} | Fallback failed: {str(e2)}'}), 400

        # Create a NEW recognizer per request to avoid shared state
        local_recognizer = sr.Recognizer()

        with sr.AudioFile(temp_input_path) as source:
            local_recognizer.adjust_for_ambient_noise(source)
            audio_data = local_recognizer.record(source)

        try:
            user_text = local_recognizer.recognize_google(audio_data, language=lang_config['speech_code'])
            print(f"Recognized text: {user_text}")
        except sr.UnknownValueError:
            return jsonify({'error': 'Could not understand audio'}), 400
        except sr.RequestError as e:
            return jsonify({'error': f'Speech recognition error: {str(e)}'}), 500

        user_id_str = get_jwt_identity()
        print('user id:', user_id_str)
        llm_response = run_chatbot2(user_text, user_id_str)

        speech_text = llm_response
        if len(llm_response) > 500:
            speech_text = 'Read the following text carefully and response accordingly:' if language=='en' else 'নিচের লেখাটি মনোযোগ সহকারে পড়ুন এবং সেই অনুযায়ী উত্তর দিন'
            llm_response = f'## {speech_text}\n{llm_response}'
        try:
            gen_audio_file(temp_output_path, speech_text)
        except Exception as ex:
            print(ex)
        # Clean up input file after successful processing
        if temp_input_path and os.path.exists(temp_input_path):
            os.remove(temp_input_path)
            temp_input_path = None  # Mark as cleaned

        return jsonify({
            'user_text': user_text,
            'llm_response': llm_response,
            'audio_id': unique_id
        })

    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

    finally:
        # Cleanup input file on any failure
        if temp_input_path and os.path.exists(temp_input_path):
            try:
                os.remove(temp_input_path)
            except:
                pass

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

# Authentication Routes

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            # Create token with string identity (required for proper JWT validation)
            access_token = create_access_token(identity=str(user.id), fresh=False)
            print(f"Created token for user {user.id}: {access_token[:50]}...")
            
            # Debug token structure
            import jwt as pyjwt
            try:
                decoded = pyjwt.decode(access_token, options={"verify_signature": False})
                print(f"Token payload: {decoded}")
            except Exception as decode_error:
                print(f"Failed to decode token: {decode_error}")
            
            return jsonify({'access_token': access_token, 'user_id': user.id}), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Doctor Routes

@app.route('/doctors', methods=['GET'])
def get_doctors():
    try:
        doctors = Doctor.query.all()
        return jsonify([{
            'id': doctor.id,
            'name': doctor.name,
            'availability': doctor.availability
        } for doctor in doctors])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/doctors', methods=['POST'])
@jwt_required()
def add_doctor():
    try:
        data = request.get_json()
        name = data.get('name')
        availability = data.get('availability')
        
        if not name or not availability:
            return jsonify({'error': 'Name and availability are required'}), 400
        
        doctor = Doctor(name=name, availability=availability)
        db.session.add(doctor)
        db.session.commit()
        
        return jsonify({
            'id': doctor.id,
            'name': doctor.name,
            'availability': doctor.availability
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Appointment Routes

@app.route('/appointments', methods=['POST'])
@jwt_required()
def book_appointment():
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)  # Convert string back to int for database
        print(f"Book appointment request from user {user_id}")
        
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        print(f"Appointment data: {data}")
        
        doctor_id = data.get('doctor_id')
        date = data.get('date')
        
        if not doctor_id or not date:
            print("Missing doctor_id or date")
            return jsonify({'error': 'Doctor ID and date are required'}), 400
        
        # Check if doctor exists
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
        
        # Check if appointment already exists for this date and doctor
        existing_appointment = Appointment.query.filter_by(
            doctor_id=doctor_id, date=date
        ).first()
        
        if existing_appointment:
            return jsonify({'error': 'This time slot is already booked'}), 400
        
        appointment = Appointment(
            user_id=user_id,
            doctor_id=doctor_id,
            date=date
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'id': appointment.id,
            'doctor_name': doctor.name,
            'date': appointment.date,
            'message': 'Appointment booked successfully'
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/appointments', methods=['GET'])
@jwt_required()
def get_user_appointments():
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)  # Convert string back to int for database
        appointments = db.session.query(Appointment, Doctor).join(
            Doctor, Appointment.doctor_id == Doctor.id
        ).filter(Appointment.user_id == user_id).all()
        
        return jsonify([{
            'id': appointment.id,
            'doctor_name': doctor.name,
            'date': appointment.date
        } for appointment, doctor in appointments])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def cancel_appointment(appointment_id):
    try:
        user_id_str = get_jwt_identity()
        user_id = int(user_id_str)  # Convert string back to int for database
        appointment = Appointment.query.filter_by(
            id=appointment_id, user_id=user_id
        ).first()
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'message': 'Appointment cancelled successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/test-jwt', methods=['GET'])
@jwt_required()
def test_jwt():
    try:
        user_id = get_jwt_identity()
        return jsonify({
            'status': 'success',
            'message': 'JWT token is valid',
            'user_id': user_id
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Speech-to-text and appointment booking service is running'})

# Initialize database and add sample data
def init_db():
    """Initialize database and add sample doctors"""
    with app.app_context():
        db.create_all()
        
        # Add sample doctors if they don't exist
        if Doctor.query.count() == 0:
            sample_doctors = [
                Doctor(name="Prof. Dr. Sharmin Rahman", skills ='M B B S (D A C), F C P S (OBS & Gynae)', availability="Mon-Fri 9AM-5PM"),
                Doctor(name="Dr. Rokeya Khatun", skills ='MBBS, MCPS (Gynae & Obs), DGO', availability="Tue-Thu 10AM-6PM"),
                Doctor(name="DR. MIR JAKIB HOSSAIN", skills ='MBBS, FCPS (MEDICINE), MD (GASTRO).', availability="Mon, Wed, Fri 8AM-4PM"),
                Doctor(name="DR. RASHIDUL HASAN SHAFIN", skills ='MBBS, BCS (HEALTH), FCPS (PEDIATRICS), FCPS PART-2 (NEWBORN)', availability="Mon-Sat 9AM-3PM")
            ]
            
            for doctor in sample_doctors:
                db.session.add(doctor)
            
            db.session.commit()
            print("✅ Sample doctors added to database")
        
        print("✅ Database initialized successfully")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
