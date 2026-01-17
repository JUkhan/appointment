from flask import request, jsonify, send_file

from flask_jwt_extended import JWTManager, jwt_required, create_access_token, create_refresh_token, get_jwt_identity, get_jwt

import speech_recognition as sr

import os
import uuid

from pydub import AudioSegment

from datetime import datetime, timedelta
from db import db
from models import User, Doctor, Appointment
from tts import gen_audio_file
from service import book_appointment

from flask_app import app

from agent.app import run_chatbot

# Create directories for temporary files
os.makedirs('temp_audio', exist_ok=True)

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

@app.route('/process-audio', methods=['POST'])
@jwt_required()
def process_audio():
    temp_input_path = None
    try:
        
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
            print(f"User text: {user_text}")
        except sr.UnknownValueError:
            return jsonify({'error': 'Could not understand audio'}), 400
        except sr.RequestError as e:
            return jsonify({'error': f'Speech recognition error: {str(e)}'}), 500

        user_id_str = get_jwt_identity()
        llm_response = run_chatbot(user_text, user_id_str)
        
        return jsonify({
            'user_text': user_text,
            'llm_response': llm_response,
            'error':None
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

@app.route('/web/process-audio', methods=['POST'])
@jwt_required()
def process_audio_web():
    temp_input_path = None
    temp_output_path = None

    try:
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
        temp_output_path = f'temp_audio/output_{unique_id}.wav'

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
            print(f"User text: {user_text}")
        except sr.UnknownValueError:
            return jsonify({'error': 'Could not understand audio'}), 400
        except sr.RequestError as e:
            return jsonify({'error': f'Speech recognition error: {str(e)}'}), 500

        user_id_str = get_jwt_identity()
        llm_response = run_chatbot(user_text, user_id_str)
        speech_text = llm_response
        if len(llm_response) > 500:
            speech_text = 'Read the following text carefully and response accordingly:' if language=='en' else 'নিচের লেখাটি মনোযোগ সহকারে পড়ুন এবং সেই অনুযায়ী উত্তর দিন'
            llm_response = f'## {speech_text}\n{llm_response}'
        try:
            gen_audio_file(temp_output_path, speech_text)
        except Exception as ex:
            print(ex)
        
        
        return jsonify({
            'user_text': user_text,
            'llm_response': llm_response,
            'audio_id': unique_id,
            'error':None
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
            
@app.route('/process-text', methods=['POST'])
@jwt_required()
def process_text():
    try:
        data = request.get_json()
        user_text = data.get('user-text')
        user_id_str = get_jwt_identity()
        print('user text:', user_text)
        llm_response = run_chatbot(user_text, user_id_str)
        return jsonify({
            'user_text': user_text,
            'llm_response': llm_response,
            'error':None
        })

    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

    

@app.route('/get-audio/<audio_id>', methods=['GET'])
def get_audio(audio_id):
    try:
        audio_path = f'temp_audio/output_{audio_id}.wav'
        if os.path.exists(audio_path):
            return send_file(audio_path, as_attachment=True, download_name='response.wav', mimetype='audio/wav')
        else:
            return jsonify({'error': 'Audio file not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Error retrieving audio: {str(e)}'}), 500

@app.route('/cleanup/<audio_id>', methods=['DELETE'])
def cleanup_audio(audio_id):
    try:
        audio_path = f'temp_audio/output_{audio_id}.wav'
        if os.path.exists(audio_path):
            os.remove(audio_path)
        return jsonify({'message': 'File cleaned up successfully'})
    except Exception as e:
        return jsonify({'error': f'Cleanup error: {str(e)}'}), 500



@app.route('/doctors', methods=['GET'])
def get_doctors():
    try:
        doctors = Doctor.query.all()
        return jsonify([{
            'id': doctor.id,
            'name': doctor.name,
            'specialization': doctor.skills,
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
def add_appointment():
    try:
        user_id_str = get_jwt_identity()
        #user_id = int(user_id_str)  # Convert string back to int for database
        print(f"Book appointment request from user {user_id_str}")
        
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        print(f"Appointment data: {data}")
        
        doctor_id = data.get('doctor_id')
        date = data.get('date')
        patient_name = data.get('patient_name')
        patient_age = data.get('patient_age')
        
        # all are required field

        if not doctor_id or not date:
            print("Missing doctor_id or date")
            return jsonify({'error': 'Doctor ID and date are required'}), 400

        if not patient_name or not patient_age:
            print("Missing patient_name or patient_age")
            return jsonify({'error': 'Patient name and age are required'}), 400
        res = book_appointment(
            user_id=user_id_str,
            date=date,
            doctor_id=doctor_id,
            patient_name=patient_name,
            patient_age=int(patient_age)
        )
        return jsonify({
            "message":res.get("message",""),
            "error":res.get("error", None),
            "appointment":res
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
        ).filter(
            Appointment.user_id == user_id,
            Appointment.is_deleted == False
        ).all()

        return jsonify([{
            'id': appointment.id,
            'doctor_name': doctor.name,
            'availability':doctor.availability,
            'date': appointment.date,
            'patient_name':appointment.patient_name,
            'serial_number':appointment.serial_number
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
            id=appointment_id, user_id=user_id, is_deleted=False
        ).first()

        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404

        # Soft delete: set is_deleted flag to True instead of hard delete
        appointment.is_deleted = True
        db.session.commit()

        return jsonify({'message': 'Appointment cancelled successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Speech-to-text and appointment booking service is running'})


