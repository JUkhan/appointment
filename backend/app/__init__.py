from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from datetime import  timedelta
from flask_cors import CORS
import os

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///appointment_system.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['CELERY_BROKER_URL'] = os.getenv('CELERY_BROKER_URL')
    app.config['CELERY_RESULT_BACKEND'] = os.getenv('CELERY_RESULT_BACKEND')

    # JWT Configuration from .env
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 15)))
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 7)))

    # Comprehensive JWT configuration to disable CSRF
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_CSRF_PROTECT'] = False
    app.config['JWT_CSRF_IN_COOKIES'] = False
    app.config['JWT_CSRF_CHECK_FORM'] = False
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

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

    # Register blueprints
    from app.routes import auth, basic, data_center, subscription;
    app.register_blueprint(auth)
    app.register_blueprint(basic)
    app.register_blueprint(data_center)
    app.register_blueprint(subscription)

    return app