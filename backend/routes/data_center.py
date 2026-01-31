from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_app import app
from db import db
from models import Client, DataUser, Transaction, TransactionalData
from datetime import datetime
from routes.parse_product import parse_products
import uuid

# ==================== CLIENT ROUTES ====================

@app.route('/api/clients', methods=['POST'])
def create_client():
    """Create a new client"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['business_name', 'address', 'email', 'mobile']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Check if business name already exists
        existing_client = Client.query.filter_by(business_name=data['business_name']).first()
        if existing_client:
            return jsonify({'error': 'Business name already exists'}), 409

        # Create new client
        client = Client(
            id = str(uuid.uuid4()),
            business_name=data['business_name'],
            address=data['address'],
            email=data['email'],
            mobile=data['mobile'],
            is_active=data.get('is_active', True),
            modules=data.get('modules', 'basic')
        )
        data_user = DataUser(
            username='admin',
            client_id=client.id,
            is_active=True,
            role='admin'
        )
        data_user.set_password('admin123')
        db.session.add(client)
        db.session.add(data_user)
        db.session.commit()

        return jsonify({
            'message': 'Client created successfully',
            'client': {
                'id': client.id,
                'business_name': client.business_name,
                'address': client.address,
                'email': client.email,
                'mobile': client.mobile,
                'is_active': client.is_active,
                'modules': client.modules,
                'created_at': client.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/clients', methods=['GET'])
@jwt_required()
def get_clients():
    """Get all clients"""
    try:
        clients = Client.query.all()

        return jsonify({
            'clients': [{
                'id': client.id,
                'business_name': client.business_name,
                'address': client.address,
                'email': client.email,
                'mobile': client.mobile,
                'is_active': client.is_active,
                'modules': client.modules,
                'created_at': client.created_at.isoformat()
            } for client in clients]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clients/<client_id>', methods=['GET'])
@jwt_required()
def get_client(client_id):
    """Get a specific client by ID"""
    try:
        client = Client.query.get(client_id)

        if not client:
            return jsonify({'error': 'Client not found'}), 404

        return jsonify({
            'id': client.id,
            'business_name': client.business_name,
            'address': client.address,
            'email': client.email,
            'mobile': client.mobile,
            'is_active': client.is_active,
            'modules': client.modules,
            'created_at': client.created_at.isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clients/<client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    """Update a client"""
    try:
        client = Client.query.get(client_id)

        if not client:
            return jsonify({'error': 'Client not found'}), 404

        data = request.get_json()

        # Update fields if provided
        if 'business_name' in data:
            # Check if new business name already exists (excluding current client)
            existing = Client.query.filter(
                Client.business_name == data['business_name'],
                Client.id != client_id
            ).first()
            if existing:
                return jsonify({'error': 'Business name already exists'}), 409
            client.business_name = data['business_name']

        if 'address' in data:
            client.address = data['address']
        if 'email' in data:
            client.email = data['email']
        if 'mobile' in data:
            client.mobile = data['mobile']
        if 'is_active' in data:
            client.is_active = data['is_active']
        if 'modules' in data:
            client.modules = data['modules']

        db.session.commit()

        return jsonify({
            'message': 'Client updated successfully',
            'client': {
                'id': client.id,
                'business_name': client.business_name,
                'address': client.address,
                'email': client.email,
                'mobile': client.mobile,
                'is_active': client.is_active,
                'modules': client.modules,
                'created_at': client.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/clients/<client_id>', methods=['DELETE'])
@jwt_required()
def delete_client(client_id):
    """Delete a client"""
    try:
        client = Client.query.get(client_id)

        if not client:
            return jsonify({'error': 'Client not found'}), 404

        db.session.delete(client)
        db.session.commit()

        return jsonify({'message': 'Client deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== DATA USER ROUTES ====================

@app.route('/api/system-settings/<client_id>', methods=['GET'])
def system_settings(client_id):
    """Get all users for a specific client"""
    try:
        # Verify client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'is_success': False}), 200
        return jsonify({'is_success': True}), 200
    except Exception as e:
      return jsonify({'error': str(e)}), 500
    
@app.route('/api/clients/<client_id>/users', methods=['GET'])
@jwt_required()
def get_users_by_client(client_id):
    """Get all users for a specific client"""
    try:
        # Verify client exists
        client = Client.query.get(client_id)
        if not client:
            return jsonify({'error': 'Client not found'}), 404

        # Get all users for this client
        users = client.users # DataUser.query.filter_by(client_id=client_id).all()

        return jsonify({
            'client_id': client_id,
            'client_name': client.business_name,
            'users': [{
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat()
            } for user in users],
            'total_users': len(users)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/data-users', methods=['POST'])
@jwt_required()
def create_data_user():
    """Create a new data user"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['username', 'password', 'client_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Check if client exists
        client = Client.query.get(data['client_id'])
        if not client:
            return jsonify({'error': 'Client not found'}), 404

        # Check if username already exists for this client
        existing_user = DataUser.query.filter_by(
            username=data['username'],
            client_id=data['client_id']
        ).first()
        if existing_user:
            return jsonify({'error': 'Username already exists for this client'}), 409

        # Create new data user
        user = DataUser(
            username=data['username'],
            client_id=data['client_id'],
            is_active=data.get('is_active', False)
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        return jsonify({
            'message': 'Data user created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'client_id': user.client_id,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/data-users', methods=['GET'])
@jwt_required()
def get_data_users():
    """Get all data users"""
    try:
        # Optional: filter by client_id
        client_id = request.args.get('client_id')

        if client_id:
            users = DataUser.query.filter_by(client_id=client_id).all()
        else:
            users = DataUser.query.all()

        return jsonify({
            'users': [{
                'id': user.id,
                'username': user.username,
                'client_id': user.client_id,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat()
            } for user in users]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/data-users/<user_id>', methods=['GET'])
@jwt_required()
def get_data_user(user_id):
    """Get a specific data user by ID"""
    try:
        user = DataUser.query.get(user_id)

        if not user:
            return jsonify({'error': 'Data user not found'}), 404

        return jsonify({
            'id': user.id,
            'username': user.username,
            'client_id': user.client_id,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/data-users/<user_id>', methods=['PUT'])
@jwt_required()
def update_data_user(user_id):
    """Update a data user"""
    try:
        user = DataUser.query.get(user_id)

        if not user:
            return jsonify({'error': 'Data user not found'}), 404

        data = request.get_json()

        # Update fields if provided
        if 'username' in data:
            # Check if new username already exists (excluding current user)
            existing = DataUser.query.filter(
                DataUser.username == data['username'],
                DataUser.client_id == user.client_id,
                DataUser.id != user_id
            ).first()
            if existing:
                return jsonify({'error': 'Username already exists for this client'}), 409
            user.username = data['username']

        if 'old_password' in data:
            if not user.check_password(data['old_password']):
                return jsonify({'error': 'You are unauthorized to update the password'}), 500

            if 'new_password' in data:
                user.set_password(data['new_password'])
                
        if 'is_active' in data:
            user.is_active = data['is_active']

        # if 'client_id' in data:
        #     # Verify new client exists
        #     client = Client.query.get(data['client_id'])
        #     if not client:
        #         return jsonify({'error': 'Client not found'}), 404
        #     user.client_id = data['client_id']

        db.session.commit()

        return jsonify({
            'message': 'Data user updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'client_id': user.client_id,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/data-users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_data_user(user_id):
    """Delete a data user"""
    try:
        user = DataUser.query.get(user_id)

        if not user:
            return jsonify({'error': 'Data user not found'}), 404

        db.session.delete(user)
        db.session.commit()

        return jsonify({'message': 'Data user deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== TRANSACTION ROUTES ====================

@app.route('/api/transactions', methods=['POST'])
@jwt_required()
def create_transaction():
    """Create a new transaction"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['client_id', 'user_text']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Verify client and user exist
        client = Client.query.get(data['client_id'])
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        
        user_id = get_jwt_identity()
        print(user_id)
        user = DataUser.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        print(data['user_text'])
        products, price = parse_products(data['user_text'])
        print(price, products)
        if(not price):
            return jsonify({'error': 'Price not recognized.'}), 500
        
        # Create new transaction
        transaction = Transaction(
            id = str(uuid.uuid4()),
            client_id=data['client_id'],
            user_id=user_id,
            price=price,
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        transactional_data=[TransactionalData(transaction_id=transaction.id, item_name=it.item_name, item_type=it.item_type, quantity=it.item_quantity) for it in products]
        
        db.session.add(transaction)
        db.session.bulk_save_objects(transactional_data)
        db.session.commit()

        return jsonify({
                'user_text': data['user_text'],
                'llm_response': 'Successfully done. You are brilliant.',
            
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    """Get all transactions"""
    try:
        # Optional filters
        client_id = request.args.get('client_id')
        user_id = request.args.get('user_id')

        query = Transaction.query

        if client_id:
            query = query.filter_by(client_id=client_id)
        if user_id:
            query = query.filter_by(user_id=user_id)

        transactions = query.all()

        return jsonify({
            'transactions': [{
                'id': t.id,
                'client_id': t.client_id,
                'user_id': t.user_id,
                'price': float(t.price),
                'latitude': float(t.latitude) if t.latitude else None,
                'longitude': float(t.longitude) if t.longitude else None,
                'created_at': t.created_at.isoformat()
            } for t in transactions]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions/<transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    """Get a specific transaction by ID"""
    try:
        transaction = Transaction.query.get(transaction_id)

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        return jsonify({
            'id': transaction.id,
            'client_id': transaction.client_id,
            'user_id': transaction.user_id,
            'price': float(transaction.price),
            'latitude': float(transaction.latitude) if transaction.latitude else None,
            'longitude': float(transaction.longitude) if transaction.longitude else None,
            'created_at': transaction.created_at.isoformat()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions/<transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    """Update a transaction"""
    try:
        transaction = Transaction.query.get(transaction_id)

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        data = request.get_json()

        # Update fields if provided
        if 'price' in data:
            transaction.price = data['price']
        if 'latitude' in data:
            transaction.latitude = data['latitude']
        if 'longitude' in data:
            transaction.longitude = data['longitude']
        if 'client_id' in data:
            client = Client.query.get(data['client_id'])
            if not client:
                return jsonify({'error': 'Client not found'}), 404
            transaction.client_id = data['client_id']
        if 'user_id' in data:
            user = DataUser.query.get(data['user_id'])
            if not user:
                return jsonify({'error': 'User not found'}), 404
            transaction.user_id = data['user_id']

        db.session.commit()

        return jsonify({
            'message': 'Transaction updated successfully',
            'transaction': {
                'id': transaction.id,
                'client_id': transaction.client_id,
                'user_id': transaction.user_id,
                'price': float(transaction.price),
                'latitude': float(transaction.latitude) if transaction.latitude else None,
                'longitude': float(transaction.longitude) if transaction.longitude else None,
                'created_at': transaction.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        transaction = Transaction.query.get(transaction_id)

        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        db.session.delete(transaction)
        db.session.commit()

        return jsonify({'message': 'Transaction deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== TRANSACTIONAL DATA ROUTES ====================

@app.route('/api/transactional-data', methods=['POST'])
@jwt_required()
def create_transactional_data():
    """Create new transactional data"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['transaction_id', 'item_name', 'item_type', 'quantity']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Verify transaction exists
        transaction = Transaction.query.get(data['transaction_id'])
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404

        # Create new transactional data
        trans_data = TransactionalData(
            transaction_id=data['transaction_id'],
            item_name=data['item_name'],
            item_type=data['item_type'],
            quantity=data['quantity']
        )

        db.session.add(trans_data)
        db.session.commit()

        return jsonify({
            'message': 'Transactional data created successfully',
            'data': {
                'id': trans_data.id,
                'transaction_id': trans_data.transaction_id,
                'item_name': trans_data.item_name,
                'item_type': trans_data.item_type,
                'quantity': trans_data.quantity
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactional-data', methods=['GET'])
@jwt_required()
def get_transactional_data():
    """Get all transactional data"""
    try:
        # Optional: filter by transaction_id
        transaction_id = request.args.get('transaction_id')

        if transaction_id:
            data_list = TransactionalData.query.filter_by(transaction_id=transaction_id).all()
        else:
            data_list = TransactionalData.query.all()

        return jsonify({
            'data': [{
                'id': d.id,
                'transaction_id': d.transaction_id,
                'item_name': d.item_name,
                'item_type': d.item_type,
                'quantity': d.quantity
            } for d in data_list]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactional-data/<data_id>', methods=['GET'])
@jwt_required()
def get_single_transactional_data(data_id):
    """Get specific transactional data by ID"""
    try:
        trans_data = TransactionalData.query.get(data_id)

        if not trans_data:
            return jsonify({'error': 'Transactional data not found'}), 404

        return jsonify({
            'id': trans_data.id,
            'transaction_id': trans_data.transaction_id,
            'item_name': trans_data.item_name,
            'item_type': trans_data.item_type,
            'quantity': trans_data.quantity
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactional-data/<data_id>', methods=['PUT'])
@jwt_required()
def update_transactional_data(data_id):
    """Update transactional data"""
    try:
        trans_data = TransactionalData.query.get(data_id)

        if not trans_data:
            return jsonify({'error': 'Transactional data not found'}), 404

        data = request.get_json()

        # Update fields if provided
        if 'item_name' in data:
            trans_data.item_name = data['item_name']
        if 'item_type' in data:
            trans_data.item_type = data['item_type']
        if 'quantity' in data:
            trans_data.quantity = data['quantity']
        if 'transaction_id' in data:
            transaction = Transaction.query.get(data['transaction_id'])
            if not transaction:
                return jsonify({'error': 'Transaction not found'}), 404
            trans_data.transaction_id = data['transaction_id']

        db.session.commit()

        return jsonify({
            'message': 'Transactional data updated successfully',
            'data': {
                'id': trans_data.id,
                'transaction_id': trans_data.transaction_id,
                'item_name': trans_data.item_name,
                'item_type': trans_data.item_type,
                'quantity': trans_data.quantity
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/transactional-data/<data_id>', methods=['DELETE'])
@jwt_required()
def delete_transactional_data(data_id):
    """Delete transactional data"""
    try:
        trans_data = TransactionalData.query.get(data_id)

        if not trans_data:
            return jsonify({'error': 'Transactional data not found'}), 404

        db.session.delete(trans_data)
        db.session.commit()

        return jsonify({'message': 'Transactional data deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
