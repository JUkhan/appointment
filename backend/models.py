from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from sqlalchemy import String
import uuid
# Models

class Client(db.Model):
    __tablename__ = 'client'
    id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_name = db.Column(db.String(80), unique=True, nullable=False)
    address = db.Column(db.String(180), nullable=False)
    email = db.Column(db.String(80), nullable=False)
    mobile = db.Column(db.String(15), nullable=False)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    modules = db.Column(db.String(80), default="basic", nullable=False)
    users = db.relationship('DataUser', backref='user', lazy=True)
    created_at = db.Column(db.DateTime, default=db.func.now())

class DataUser(db.Model):
    __tablename__ = 'data_user'
    id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    client_id = db.Column(String(36), db.ForeignKey('client.id'))
    created_at = db.Column(db.DateTime, default=db.func.now())
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Transaction(db.Model):
    __tablename__ = 'transaction'
    id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = db.Column(String(36), db.ForeignKey('client.id'))
    user_id = db.Column(String(36), db.ForeignKey('data_user.id'))
    price = db.Column(db.Numeric(10, 2))
    latitude = db.Column(db.Numeric(10, 7), nullable=True)
    longitude = db.Column(db.Numeric(10, 7), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())

class TransactionalData(db.Model):
    __tablename__ = 'transactional_data'
    id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(String(36), db.ForeignKey('client.id'))
    item_name = db.Column(db.String(20), nullable=False)
    item_type = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    appointments = db.relationship('Appointment', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    availability = db.Column(db.String(120), nullable=False)
    skills = db.Column(db.String(220), nullable=False)
    appointments = db.relationship('Appointment', backref='doctor', lazy=True)

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    patient_name = db.Column(db.String(80), nullable=False)
    patient_age = db.Column(db.Integer, nullable=False)
    serial_number= db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)


