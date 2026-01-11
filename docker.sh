#!/bin/bash

# Docker management script for Appointment Booking System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_info "Creating .env from template..."
        cat > .env << EOF
GOOGLE_API_KEY=your_google_api_key_here
JWT_SECRET_KEY=change-this-to-a-random-secret-key
JWT_ACCESS_TOKEN_EXPIRES=15
JWT_REFRESH_TOKEN_EXPIRES=7
EOF
        print_warning "Please update .env with your actual values"
        exit 1
    fi
}

case "$1" in
    start)
        print_info "Starting application in production mode..."
        check_env
        docker-compose up -d
        print_info "Application started!"
        print_info "Frontend: http://localhost"
        print_info "Backend: http://localhost:5000"
        ;;

    dev)
        print_info "Starting application in development mode..."
        check_env
        docker-compose -f docker-compose.dev.yml up
        ;;

    stop)
        print_info "Stopping application..."
        docker-compose down
        print_info "Application stopped!"
        ;;

    restart)
        print_info "Restarting application..."
        docker-compose restart
        print_info "Application restarted!"
        ;;

    logs)
        if [ -z "$2" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f "$2"
        fi
        ;;

    build)
        print_info "Building Docker images..."
        check_env
        docker-compose build --no-cache
        print_info "Build complete!"
        ;;

    clean)
        print_warning "This will remove all containers, volumes, and images!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleaning up..."
            docker-compose down -v --rmi all
            print_info "Cleanup complete!"
        fi
        ;;

    backup)
        print_info "Backing up database..."
        mkdir -p backups
        BACKUP_FILE="backups/appointment_backup_$(date +%Y%m%d_%H%M%S).db"
        docker cp appointment-backend:/app/instance/appointment_system.db "$BACKUP_FILE"
        print_info "Database backed up to $BACKUP_FILE"
        ;;

    restore)
        if [ -z "$2" ]; then
            print_error "Please specify backup file: ./docker.sh restore <backup_file>"
            exit 1
        fi
        if [ ! -f "$2" ]; then
            print_error "Backup file not found: $2"
            exit 1
        fi
        print_warning "This will overwrite the current database!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Restoring database from $2..."
            docker cp "$2" appointment-backend:/app/instance/appointment_system.db
            docker-compose restart backend
            print_info "Database restored!"
        fi
        ;;

    shell)
        SERVICE=${2:-backend}
        print_info "Opening shell in $SERVICE container..."
        docker-compose exec "$SERVICE" /bin/sh
        ;;

    status)
        docker-compose ps
        ;;

    *)
        echo "Usage: ./docker.sh {start|dev|stop|restart|logs|build|clean|backup|restore|shell|status}"
        echo ""
        echo "Commands:"
        echo "  start          Start application in production mode"
        echo "  dev            Start application in development mode with hot reloading"
        echo "  stop           Stop all containers"
        echo "  restart        Restart all containers"
        echo "  logs [service] View logs (optional: specify backend or frontend)"
        echo "  build          Rebuild Docker images"
        echo "  clean          Remove all containers, volumes, and images"
        echo "  backup         Backup database"
        echo "  restore <file> Restore database from backup"
        echo "  shell [service] Open shell in container (default: backend)"
        echo "  status         Show container status"
        exit 1
        ;;
esac
