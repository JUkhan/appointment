#!/usr/bin/env python3

from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import jwt as pyjwt

app = Flask(__name__)

# Same configuration as our main app
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_CSRF_PROTECT'] = False
app.config['JWT_CSRF_IN_COOKIES'] = False
app.config['JWT_CSRF_CHECK_FORM'] = False
app.config['JWT_COOKIE_CSRF_PROTECT'] = False

jwt = JWTManager(app)

@app.route('/test-token')
def test_token():
    # Create a token with the same settings
    access_token = create_access_token(identity="2", fresh=False)
    
    # Decode and inspect the token
    try:
        decoded = pyjwt.decode(access_token, options={"verify_signature": False})
        print("Token payload:", decoded)
        
        # Try to verify with our secret
        try:
            verified = pyjwt.decode(access_token, 'your-secret-key-change-in-production', algorithms=['HS256'])
            print("Token verification: SUCCESS")
            print("Verified payload:", verified)
        except Exception as verify_error:
            print("Token verification failed:", verify_error)
            
    except Exception as decode_error:
        print("Failed to decode token:", decode_error)
    
    return {"token": access_token, "length": len(access_token)}

@app.route('/verify-token')
@jwt_required()
def verify_token():
    user_id = get_jwt_identity()
    return {"status": "success", "user_id": user_id}

if __name__ == '__main__':
    with app.app_context():
        result = test_token()
        print("Test result:", result)
