# Docker Deployment Guide

This guide explains how to run the Appointment Booking System using Docker.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher
- At least 2GB of free disk space

## Quick Start

### 1. Environment Setup

Make sure your `.env` file exists in the project root with the following variables:

```env
GOOGLE_API_KEY=your_google_api_key_here
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=15
JWT_REFRESH_TOKEN_EXPIRES=7
```

### 2. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes database data)
docker-compose down -v
```

### 3. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Manual Docker Build

If you prefer to build images manually:

### Backend

```bash
# Build backend image
docker build -t appointment-backend .

# Run backend container
docker run -d \
  --name appointment-backend \
  -p 5000:5000 \
  -v $(pwd)/instance:/app/instance \
  -v $(pwd)/temp_audio:/app/temp_audio \
  --env-file .env \
  appointment-backend
```

### Frontend

```bash
# Navigate to frontend directory
cd frontend

# Build frontend image
docker build -t appointment-frontend .

# Run frontend container
docker run -d \
  --name appointment-frontend \
  -p 80:80 \
  --link appointment-backend:backend \
  appointment-frontend
```

## Docker Commands Reference

### Service Management

```bash
# Start services
docker-compose start

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# Remove stopped containers
docker-compose rm
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Database Management

```bash
# Access backend container shell
docker-compose exec backend /bin/bash

# Initialize database manually
docker-compose exec backend python -c "from app import init_db; init_db()"

# Backup database
docker cp appointment-backend:/app/instance/appointment_system.db ./backup.db

# Restore database
docker cp ./backup.db appointment-backend:/app/instance/appointment_system.db
docker-compose restart backend
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# Remove all unused Docker resources
docker system prune -a
```

## Production Deployment

### 1. Update Environment Variables

Create a production `.env` file with secure values:

```env
GOOGLE_API_KEY=your_production_api_key
JWT_SECRET_KEY=use_a_strong_random_secret_key_here
JWT_ACCESS_TOKEN_EXPIRES=15
JWT_REFRESH_TOKEN_EXPIRES=7
FLASK_ENV=production
```

### 2. Use Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    environment:
      - FLASK_ENV=production
    env_file:
      - .env.production

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Enable HTTPS (Recommended)

For production, use a reverse proxy like Nginx or Traefik with SSL certificates.

Example with Nginx:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com

# Certbot will automatically configure Nginx
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Missing .env file - create one with required variables
# 2. Port 5000 already in use - change port in docker-compose.yml
# 3. Database initialization failed - delete instance folder and restart
```

### Frontend can't connect to backend

```bash
# Check if backend is running
docker-compose ps

# Check backend health
curl http://localhost:5000/health

# Verify network connectivity
docker-compose exec frontend ping backend
```

### Database issues

```bash
# Reset database
docker-compose down
rm -rf instance/
docker-compose up -d

# The database will be recreated automatically
```

### Port conflicts

If ports 80 or 5000 are already in use, modify `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "5001:5000"  # Change host port to 5001

  frontend:
    ports:
      - "8080:80"    # Change host port to 8080
```

## Performance Optimization

### 1. Multi-stage Builds

The frontend Dockerfile uses multi-stage builds to reduce image size:
- Build stage: Compiles React app
- Production stage: Serves static files with Nginx

### 2. Volume Mounts

Persistent data is stored in volumes:
- `instance/`: SQLite database
- `temp_audio/`: Temporary audio files

### 3. Health Checks

Both services include health checks for better orchestration:
- Backend: Checks `/health` endpoint
- Frontend: Checks Nginx availability

## Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Nginx (Port 80)│
│    Frontend     │
└────────┬────────┘
         │ API Proxy
         ▼
┌─────────────────┐
│ Flask (Port 5000)│
│     Backend     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SQLite DB     │
│   (Volume)      │
└─────────────────┘
```

## Security Considerations

1. **Change default secrets**: Update JWT_SECRET_KEY in production
2. **Use HTTPS**: Always use SSL/TLS in production
3. **Limit exposed ports**: Only expose necessary ports
4. **Regular updates**: Keep Docker images and dependencies updated
5. **Environment variables**: Never commit `.env` files to git
6. **Database backups**: Regularly backup the database volume

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify environment variables
- Ensure all required ports are available
- Check Docker and Docker Compose versions
