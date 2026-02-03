from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from sqlalchemy import String
from datetime import datetime, timedelta, timezone
import uuid
# Models

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_name = db.Column(db.String(80), unique=True, nullable=False)
    address = db.Column(db.String(180), nullable=False)
    email = db.Column(db.String(80), nullable=False)
    mobile = db.Column(db.String(15), nullable=False)
    modules = db.Column(db.String(80), default="basic", nullable=False)
    users = db.relationship('DataUser', backref='users', lazy=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    subscription = db.relationship('Subscription', backref='clients', uselist=False, cascade='all, delete-orphan')

class DataUser(db.Model):
    __tablename__ = 'data_users'
    id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(6), nullable=False)
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    client_id = db.Column(String(36), db.ForeignKey('clients.id'))
    created_at = db.Column(db.DateTime, default=db.func.now())
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = db.Column(String(36), db.ForeignKey('clients.id'))
    user_id = db.Column(String(36), db.ForeignKey('data_users.id'))
    price = db.Column(db.Numeric(10, 2))
    latitude = db.Column(db.Numeric(10, 7), nullable=True)
    longitude = db.Column(db.Numeric(10, 7), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())

class TransactionalData(db.Model):
    __tablename__ = 'transactional_data'
    id = db.Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(String(36), db.ForeignKey('transactions.id'))
    item_name = db.Column(db.String(20), nullable=False)
    item_type = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False)
    plan = db.Column(db.String(20), nullable=False)  # 'week', 'month', '3month', '6month', 'year'
    start_date = db.Column(db.DateTime, nullable=False, default=db.func.now())
    end_date = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())
    
    @staticmethod
    def calculate_end_date(plan):
        now = datetime.utcnow()
        if plan == 'week':
            return now + timedelta(days=7)
        elif plan == 'month':
            return now + timedelta(days=30)
        elif plan == '3month':
            return now + timedelta(days=90)
        elif plan == '6month':
            return now + timedelta(days=180)
        elif plan == 'year':
            return now + timedelta(days=365)
        raise ValueError('Invalid plan')
    


