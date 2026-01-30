from flask import request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, create_refresh_token, get_jwt_identity
from flask_app import app
from db import db
from models import  DataUser

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



# Authentication Routes

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        client_id=data.get('client_id')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        if DataUser.query.filter_by(username=username, client_id=client_id).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        user = DataUser(username=username, client_id=client_id, role='user', is_active=True)
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
        client_id=data.get('client_id')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        user = DataUser.query.filter_by(username=username, client_id=client_id).first()

        if user and user.check_password(password) and user.is_active:
            # Create both access and refresh tokens
            claims={'role':user.role, 'is_active':user.is_active}
            access_token = create_access_token(identity=str(user.id), fresh=True, additional_claims=claims)
            refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)

            print(f"Created tokens for user {user.id}")

            return jsonify({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user_id': user.id
            }), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token
    Returns a new access token
    """
    try:
        current_user = get_jwt_identity()
        print('::::refresh:::::',current_user)
        user = DataUser.query.filter_by(id=current_user).first()
        if not user.is_active:
            return jsonify({'error': str(e)}), 500
        claims={'role':user.role, 'is_active':user.is_active}
        new_access_token = create_access_token(identity=current_user, fresh=False, additional_claims=claims)

        return jsonify({
            'access_token': new_access_token
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


