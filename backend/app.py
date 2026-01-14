import os
from datetime import  timedelta
from flask_app import app
from db import db
from init_db import init_db

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///appointment_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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

db.init_app(app)

from routes.auth_routes import *
from routes.basic_routes import *

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
