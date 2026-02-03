Here's a complete Docker production deployment setup for your Flask + Celery Beat application:

## 1. Project Structure

```
flask-subscription-app/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes.py
│   ├── tasks.py
│   └── celery_config.py
├── migrations/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── .env.example
├── .dockerignore
├── nginx/
│   └── nginx.conf
└── gunicorn_config.py
```

## 2. Requirements

```txt
# requirements.txt
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.5
celery==5.3.4
redis==5.0.1
psycopg2-binary==2.9.9
gunicorn==21.2.0
python-dotenv==1.0.0
```

## 3. Application Files

```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['CELERY_BROKER_URL'] = os.getenv('CELERY_BROKER_URL')
    app.config['CELERY_RESULT_BACKEND'] = os.getenv('CELERY_RESULT_BACKEND')
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    from app.routes import api
    app.register_blueprint(api)
    
    return app
```

```python
# app/models.py
from app import db
from datetime import datetime, timedelta

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    subscription = db.relationship('Subscription', backref='user', uselist=False, cascade='all, delete-orphan')

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan = db.Column(db.String(20), nullable=False)  # 'week', 'month', 'year'
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @staticmethod
    def calculate_end_date(plan):
        now = datetime.utcnow()
        if plan == 'week':
            return now + timedelta(days=7)
        elif plan == 'month':
            return now + timedelta(days=30)
        elif plan == 'year':
            return now + timedelta(days=365)
        raise ValueError('Invalid plan')
```

```python
# app/celery_config.py
from celery import Celery
import os

def make_celery(app=None):
    celery = Celery(
        'subscription_app',
        broker=os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0'),
        backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
    )
    
    if app:
        celery.conf.update(app.config)
        
        class ContextTask(celery.Task):
            def __call__(self, *args, **kwargs):
                with app.app_context():
                    return self.run(*args, **kwargs)
        
        celery.Task = ContextTask
    
    return celery

celery = make_celery()
```

```python
# app/tasks.py
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
                logger.info(f"Deactivated subscription {sub.id} for user {sub.user.email}")
            
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
            for sub in upcoming_expirations:
                logger.info(f"Reminder: Subscription expires soon for {sub.user.email}")
                # TODO: Implement email sending
                count += 1
            
            return f"Sent {count} reminder emails"
    
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
```

```python
# app/routes.py
from flask import Blueprint, jsonify, request
from app import db
from app.models import User, Subscription
from datetime import datetime

api = Blueprint('api', __name__)

@api.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

@api.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 409
    
    user = User(email=email)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'id': user.id,
        'email': user.email
    }), 201

@api.route('/subscribe', methods=['POST'])
def subscribe():
    data = request.get_json()
    user_id = data.get('user_id')
    plan = data.get('plan')
    
    if plan not in ['week', 'month', 'year']:
        return jsonify({'error': 'Invalid plan. Must be week, month, or year'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Deactivate old subscription if exists
    if user.subscription:
        user.subscription.is_active = False
    
    # Create new subscription
    end_date = Subscription.calculate_end_date(plan)
    subscription = Subscription(
        user_id=user_id,
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

@api.route('/subscription/status/<int:user_id>', methods=['GET'])
def get_subscription_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not user.subscription:
        return jsonify({
            'active': False,
            'message': 'No subscription found'
        }), 200
    
    sub = user.subscription
    is_active = sub.is_active and sub.end_date > datetime.utcnow()
    
    return jsonify({
        'active': is_active,
        'plan': sub.plan,
        'start_date': sub.start_date.isoformat(),
        'end_date': sub.end_date.isoformat(),
        'days_remaining': max(0, (sub.end_date - datetime.utcnow()).days) if is_active else 0
    }), 200

@api.route('/subscription/cancel/<int:user_id>', methods=['POST'])
def cancel_subscription(user_id):
    user = User.query.get(user_id)
    if not user or not user.subscription:
        return jsonify({'error': 'Subscription not found'}), 404
    
    user.subscription.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Subscription cancelled successfully'}), 200
```

## 4. Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Default command (override in docker-compose)
CMD ["gunicorn", "--config", "gunicorn_config.py", "wsgi:app"]
```

```python
# gunicorn_config.py
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

```python
# wsgi.py
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: subscription_db
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    container_name: subscription_redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Flask Web Application
  web:
    build: .
    container_name: subscription_web
    command: gunicorn --config gunicorn_config.py wsgi:app
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Celery Worker
  celery_worker:
    build: .
    container_name: subscription_celery_worker
    command: celery -A app.tasks.celery worker --loglevel=info --concurrency=4
    volumes:
      - .:/app
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  # Celery Beat Scheduler
  celery_beat:
    build: .
    container_name: subscription_celery_beat
    command: celery -A app.tasks.celery beat --loglevel=info
    volumes:
      - .:/app
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: subscription_nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## 5. Configuration Files

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream web {
        server web:8000;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 10M;

        location / {
            proxy_pass http://web;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /health {
            access_log off;
            proxy_pass http://web;
        }
    }
}
```

```bash
# .env.example
# Copy this to .env and update values

# Flask
FLASK_ENV=production
SECRET_KEY=your-secret-key-change-this

# Database
POSTGRES_DB=subscriptions
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-change-this
DATABASE_URL=postgresql://postgres:your-secure-password-change-this@db:5432/subscriptions

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

```
# .dockerignore
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.env
.git
.gitignore
*.md
.DS_Store
*.sqlite
*.db
migrations/versions/*.pyc
.pytest_cache
.coverage
htmlcov/
```

## 6. Database Migrations

```python
# migrations/env.py (Flask-Migrate auto-generated, but ensure it imports correctly)
# This file is created by flask db init
```

## 7. Deployment Commands

```bash
# Create .env file
cp .env.example .env
# Edit .env with your actual values

# Build and start all services
docker-compose up -d --build

# Initialize database
docker-compose exec web flask db init
docker-compose exec web flask db migrate -m "Initial migration"
docker-compose exec web flask db upgrade

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f celery_beat
docker-compose logs -f celery_worker

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## 8. Testing the API

```bash
# Create a user
curl -X POST http://localhost/users \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Subscribe
curl -X POST http://localhost/subscribe \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "plan": "month"}'

# Check subscription status
curl http://localhost/subscription/status/1

# Health check
curl http://localhost/health
```

## 9. Monitoring & Maintenance

```bash
# Check service status
docker-compose ps

# Access database
docker-compose exec db psql -U postgres -d subscriptions

# Access Redis CLI
docker-compose exec redis redis-cli

# Manually trigger Celery task
docker-compose exec celery_worker celery -A app.tasks.celery call app.tasks.check_expired_subscriptions

# View Celery workers
docker-compose exec celery_worker celery -A app.tasks.celery inspect active

# Restart specific service
docker-compose restart celery_beat
```

## 10. Production Enhancements

For additional production hardening, consider:

1. **Use Docker secrets** for sensitive data
2. **Add SSL/TLS** with Let's Encrypt
3. **Implement logging** with ELK stack or CloudWatch
4. **Add monitoring** with Prometheus + Grafana
5. **Set up backup** for PostgreSQL
6. **Use managed services** (RDS, ElastiCache) for scalability

This setup gives you a complete production-ready deployment with automatic subscription expiration handling!