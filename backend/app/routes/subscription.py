from flask import Blueprint, jsonify, request
from app import db
from app.models import Client, Subscription
from datetime import datetime, timezone
from flask_jwt_extended import jwt_required

api = Blueprint('subscription', __name__)

@api.route('/subscribe', methods=['POST'])
@jwt_required()
def subscribe():
    data = request.get_json()
    client_id = data.get('client_id')
    plan = data.get('plan')
    
    if plan not in ['week', 'month', '3month', '6month', 'year']:
        return jsonify({'error': 'Invalid plan. Must be week, month, or year'}), 400
    
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'User not found'}), 404
    
    # Deactivate old subscription if exists
    if client.subscription:
        client.subscription.is_active = False
    
    # Create new subscription
    end_date = Subscription.calculate_end_date(plan)
    subscription = Subscription(
        client_id=client_id,
        plan=plan,
        start_date=datetime.utcnow(),
        end_date=end_date,
        is_active=True
    )
    
    db.session.add(subscription)
    db.session.commit()
    
    return jsonify({
        'message': 'Subscription created successfully',
        'subscription_id': subscription.id,
        'plan': plan,
        'start_date': subscription.start_date.isoformat(),
        'end_date': end_date.isoformat()
    }), 201

@api.route('/subscription/status/<string:client_id>', methods=['GET'])
@jwt_required()
def get_subscription_status(client_id):
    client = Client.query.get(client_id)
    if not client:
        return jsonify({'error': 'User not found'}), 404
    
    if not client.subscription:
        return jsonify({
            'active': False,
            'message': 'No subscription found'
        }), 200
    
    sub = client.subscription
    is_active = sub.is_active and sub.end_date > datetime.utcnow()
    
    return jsonify({
        'active': is_active,
        'plan': sub.plan,
        'start_date': sub.start_date.isoformat(),
        'end_date': sub.end_date.isoformat(),
        'days_remaining': max(0, (sub.end_date - datetime.utcnow()).days) if is_active else 0
    }), 200

@api.route('/subscription/cancel/<string:client_id>', methods=['POST'])
@jwt_required()
def cancel_subscription(client_id):
    client = Client.query.get(client_id)
    if not client or not client.subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    client.subscription.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Subscription cancelled successfully'}), 200