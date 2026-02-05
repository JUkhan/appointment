from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Transaction
from app import db
from datetime import datetime, timedelta
from sqlalchemy import func, extract, and_, case
from decimal import Decimal

analytics = Blueprint('analytics', __name__)

@analytics.route('/api/analytics/transactions', methods=['POST'])
@jwt_required()
def get_transaction_analytics():
    """
    Get transaction analytics based on time period

    Request body:
    {
        "client_id": "string",
        "date": "2026-01-01",
        "type": "day|month|year",
        "move": "next|prev"
    }

    Returns up to 5 periods with label and total price
    """
    try:
        data = request.get_json()
        client_id = data.get('client_id')
        date_str = data.get('date')
        period_type = data.get('type')
        move = data.get('move')

        # Validate required fields
        if not all([client_id, date_str, period_type, move]):
            return jsonify({'error': 'Missing required fields: client_id, date, type, move'}), 400

        # Validate type
        if period_type not in ['day', 'month', 'year']:
            return jsonify({'error': 'Invalid type. Must be day, month, or year'}), 400

        # Validate move
        if move not in ['next', 'prev']:
            return jsonify({'error': 'Invalid move. Must be next or prev'}), 400

        # Parse the date
        try:
            start_date = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

        # Calculate the date range and generate expected periods
        periods = []

        if period_type == 'year':
            # Calculate year range
            for i in range(5):
                offset = i if move == 'prev' else -i
                current_year = start_date.year - offset
                periods.append({
                    'label': str(current_year),
                    'start': datetime(current_year, 1, 1),
                    'end': datetime(current_year, 12, 31, 23, 59, 59)
                })

            # Single database query with GROUP BY year
            query = db.session.query(
                extract('year', Transaction.created_at).label('period'),
                func.sum(Transaction.price).label('total')
            ).filter(
                and_(
                    Transaction.client_id == client_id,
                    Transaction.created_at >= periods[-1]['start'],
                    Transaction.created_at <= periods[0]['end']
                )
            ).group_by(extract('year', Transaction.created_at))

        elif period_type == 'month':
            # Calculate month range
            for i in range(5):
                offset = i if move == 'prev' else -i
                target_month = start_date.month - offset
                target_year = start_date.year

                # Handle year boundaries
                while target_month < 1:
                    target_month += 12
                    target_year -= 1
                while target_month > 12:
                    target_month -= 12
                    target_year += 1

                # Get the last day of the month
                if target_month == 12:
                    month_end = datetime(target_year, 12, 31, 23, 59, 59)
                else:
                    month_end = datetime(target_year, target_month + 1, 1) - timedelta(seconds=1)

                month_start = datetime(target_year, target_month, 1)

                periods.append({
                    'label': f'{target_year}-{target_month:02d}',
                    'start': month_start,
                    'end': month_end,
                    'year': target_year,
                    'month': target_month
                })

            # Single database query with GROUP BY year and month
            query = db.session.query(
                extract('year', Transaction.created_at).label('year'),
                extract('month', Transaction.created_at).label('month'),
                func.sum(Transaction.price).label('total')
            ).filter(
                and_(
                    Transaction.client_id == client_id,
                    Transaction.created_at >= periods[-1]['start'],
                    Transaction.created_at <= periods[0]['end']
                )
            ).group_by(
                extract('year', Transaction.created_at),
                extract('month', Transaction.created_at)
            )

        elif period_type == 'day':
            # Calculate day range
            for i in range(5):
                offset = i if move == 'prev' else -i
                target_date = start_date - timedelta(days=offset)
                day_start = datetime(target_date.year, target_date.month, target_date.day)
                day_end = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

                periods.append({
                    'label': target_date.strftime('%Y-%m-%d'),
                    'start': day_start,
                    'end': day_end
                })

            # Single database query with GROUP BY date
            query = db.session.query(
                func.date(Transaction.created_at).label('date'),
                func.sum(Transaction.price).label('total')
            ).filter(
                and_(
                    Transaction.client_id == client_id,
                    Transaction.created_at >= periods[-1]['start'],
                    Transaction.created_at <= periods[0]['end']
                )
            ).group_by(func.date(Transaction.created_at))

        # Execute the single query
        db_results = query.all()

        # Create a lookup dictionary from database results
        if period_type == 'year':
            lookup = {int(row.period): float(row.total) for row in db_results}
            results = [
                {
                    'label': period['label'],
                    'price': lookup.get(int(period['label']), 0.0)
                }
                for period in periods
            ]
        elif period_type == 'month':
            lookup = {f"{int(row.year)}-{int(row.month):02d}": float(row.total) for row in db_results}
            results = [
                {
                    'label': period['label'],
                    'price': lookup.get(period['label'], 0.0)
                }
                for period in periods
            ]
        elif period_type == 'day':
            # func.date() returns a string in SQLite, not a date object
            lookup = {str(row.date): float(row.total) for row in db_results}
            results = [
                {
                    'label': period['label'],
                    'price': lookup.get(period['label'], 0.0)
                }
                for period in periods
            ]

        # Reverse the list if moving forward (next) to maintain chronological order
        if move == 'next':
            results.reverse()

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
