from app.celery_config import celery
from celery.schedules import crontab
from datetime import datetime, timedelta
from sqlalchemy import and_
import logging

logger = logging.getLogger(__name__)

@celery.task(name='app.tasks.check_expired_subscriptions', bind=True, max_retries=3)
def check_expired_subscriptions(self):
    """Check and deactivate expired subscriptions"""
    try:
        from app import create_app, db
        from app.models import Subscription
        
        app = create_app()
        with app.app_context():
            expired_subs = Subscription.query.filter(
                and_(
                    Subscription.end_date <= datetime.utcnow(),
                    Subscription.is_active == True
                )
            ).all()
            
            count = 0
            for sub in expired_subs:
                sub.is_active = False
                count += 1
                client = sub.clients
                logger.info(f"Deactivated subscription {sub.id} for client {client.email}")
            
            db.session.commit()
            logger.info(f"Successfully deactivated {count} expired subscriptions")
            return f"Deactivated {count} expired subscriptions"
    
    except Exception as e:
        logger.error(f"Error checking expired subscriptions: {str(e)}")
        db.session.rollback()
        raise self.retry(exc=e, countdown=60)

@celery.task(name='app.tasks.send_expiration_reminder')
def send_expiration_reminder():
    """Send reminder emails 2 days before expiration"""
    try:
        from app import create_app, db
        from app.models import Subscription
        from app.utils.email import send_subscription_expiration_reminder

        app = create_app()
        with app.app_context():
            reminder_date = datetime.utcnow() + timedelta(days=2)

            upcoming_expirations = Subscription.query.filter(
                and_(
                    Subscription.end_date <= reminder_date,
                    Subscription.end_date > datetime.utcnow(),
                    Subscription.is_active == True
                )
            ).all()

            count = 0
            failed = 0
            for sub in upcoming_expirations:
                client = sub.clients
                days_remaining = (sub.end_date - datetime.utcnow()).days

                # Send email reminder
                if send_subscription_expiration_reminder(
                    client_email=client.email,
                    business_name=client.business_name,
                    days_remaining=days_remaining,
                    end_date=sub.end_date
                ):
                    count += 1
                    logger.info(f"Sent reminder to {client.email} for subscription {sub.id}")
                else:
                    failed += 1
                    logger.warning(f"Failed to send reminder to {client.email}")

            return f"Sent {count} reminder emails ({failed} failed)"

    except Exception as e:
        logger.error(f"Error sending reminders: {str(e)}")
        raise

# Celery Beat Schedule
celery.conf.beat_schedule = {
    'check-expired-subscriptions': {
        'task': 'app.tasks.check_expired_subscriptions',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
    'send-expiration-reminders': {
        'task': 'app.tasks.send_expiration_reminder',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM UTC
    },
}

celery.conf.timezone = 'UTC'