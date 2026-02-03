# celerybeat-schedule.py
from celery.schedules import crontab

celery.conf.beat_schedule = {
    'check-expired-subscriptions': {
        'task': 'tasks.check_expired_subscriptions',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
}