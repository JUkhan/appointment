from db import db
from models import Doctor, Appointment, User
import dateparser

def get_doctors():
    result=['id, name, skills, availability']
    try:
        doctors = Doctor.query.all()
        for doctor in doctors:
            result.append(f'{doctor.id}, {doctor.name}, {doctor.skills}, {doctor.availability}')
        
    except:
        pass
    return '\n'.join(result)

def get_doctor_list():
    try:
        doctors = Doctor.query.all()
        return [{
            'id': doctor.id,
            'name': doctor.name,
            'skills': doctor.skills,
            'availability': doctor.availability
        } for doctor in doctors]
    except Exception as e:
        return []

def book_appointment(user_id: str, doctor_id: str, patient_name: str, patient_age: int, date: str):
    print("appointment Date:",date)
    try:
        # Input validation
        if not patient_name or not patient_name.strip():
            return {'error': 'Patient name is required'}

        if patient_age <= 0 or patient_age > 150:
            return {'error': 'Invalid patient age'}

        user_id = int(user_id)
        doctor_id = int(doctor_id)

        # Convert string date to DateTime object
        # Assuming date format is ISO format (YYYY-MM-DD HH:MM:SS) or similar
        try:
            if isinstance(date, str):
                # Try parsing common datetime formats
                date_obj = dateparser.parse(date)
                print('date object', date_obj)
            else:
                date_obj = date
        except ValueError:
            return {'error': 'Invalid date format. Please use ISO format (YYYY-MM-DD HH:MM:SS)'}
        
        # Check if doctor exists
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return {'error': 'Doctor not found'}
        
        # Check if user exists (optional)
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}
        
        # Check if appointment already exists for this date and doctor (excluding soft-deleted)
        existing_appointment = Appointment.query.filter_by(
           user_id=user_id, doctor_id=doctor_id, date=date_obj, patient_name=patient_name, is_deleted=False
        ).first()

        if existing_appointment:
            return {'error': 'Already booked by you'}
        
        # Get serial number more safely (excluding soft-deleted appointments)
        serial_count = Appointment.query.filter_by(
            doctor_id=doctor_id, date=date_obj, is_deleted=False
        ).count()
        
        appointment = Appointment(
            date=date_obj,
            patient_name=patient_name.strip(),
            patient_age=patient_age,
            serial_number=serial_count + 1,
            user_id=user_id,
            doctor_id=doctor_id
        )

        db.session.add(appointment)
        db.session.commit()

        return {
            'appointment_id': appointment.id,
            'user_id':appointment.user_id,
            'patient_name': appointment.patient_name,
            'doctor_name': doctor.name,
            'date': str(appointment.date),
            'serial_number': appointment.serial_number,
            'message': 'Appointment booked successfully'
        }
    except ValueError:
        return {'error': 'Invalid user_id or doctor_id format'}
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}


def get_user_appointments(user_id: str):
    try:
        user_id = int(user_id)
        appointments = db.session.query(Appointment, Doctor).join(
            Doctor, Appointment.doctor_id == Doctor.id
        ).filter(
            Appointment.user_id == user_id,
            Appointment.is_deleted == False
        ).all()

        return [{
            'id': appointment.id,
            'doctor_name': doctor.name,
            'appointment_date': str(appointment.date),
            'patient_name':appointment.patient_name,
            'serial_number':appointment.serial_number
        } for appointment, doctor in appointments]
    except Exception as e:
        return {'error': str(e)}


def cancel_appointment(appointment_id: str, user_id: str):
    try:
        appointment_id = int(appointment_id)
        user_id = int(user_id)
        appointment = Appointment.query.filter_by(
            id=appointment_id, user_id=user_id, is_deleted=False
        ).first()

        if not appointment:
            return {'error': 'Appointment not found'}

        # Soft delete: set is_deleted flag to True instead of hard delete
        appointment.is_deleted = True
        db.session.commit()

        return {'message': 'Appointment cancelled successfully'}
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}