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