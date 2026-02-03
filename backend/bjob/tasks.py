# tasks.py
from celery import Celery
from datetime import datetime
from app import db, create_app
from app.models import Subscription
import os

# Initialize Celery with broker from environment
celery = Celery(
    'tasks',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
)

@celery.task
def check_expired_subscriptions():
    # Create Flask app context for database operations
    app = create_app()
    with app.app_context():
        expired = Subscription.query.filter(
            Subscription.end_date <= datetime.utcnow(),
            Subscription.is_active == True
        ).all()

        for sub in expired:
            sub.is_active = False
            # Send notification, revoke access, etc.

        db.session.commit()

        return f"Deactivated {len(expired)} expired subscriptions"