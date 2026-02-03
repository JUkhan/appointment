# tasks.py
from celery import Celery
from datetime import datetime
from db import db
from your_app.models import Subscription

celery = Celery('tasks', broker='redis://localhost:6379')

@celery.task
def check_expired_subscriptions():
    expired = Subscription.query.filter(
        Subscription.end_date <= datetime.utcnow(),
        Subscription.is_active == True
    ).all()
    
    for sub in expired:
        sub.is_active = False
        # Send notification, revoke access, etc.
    
    db.session.commit()