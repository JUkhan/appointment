"""Gunicorn configuration file for Doctor Appointment System"""

import multiprocessing
import os


# Server Socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker Processes
workers = int(os.getenv("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"  # Use 'gevent' or 'eventlet' for async if needed
worker_connections = 1000
max_requests = 1000  # Restart workers after this many requests (prevents memory leaks)
max_requests_jitter = 50  # Add randomness to max_requests to prevent all workers restarting simultaneously
timeout = 120  # Workers silent for more than this many seconds are killed (important for audio processing)
graceful_timeout = 30  # Timeout for graceful workers restart
keepalive = 5  # The number of seconds to wait for requests on a Keep-Alive connection

# Server Mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = os.getenv("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process Naming
proc_name = "doctor-appointment-backend"

# Server Hooks
def on_starting(server):
    """Called just before the master process is initialized."""
    print("🚀 Starting Doctor Appointment Backend Server...")

def on_reload(server):
    """Called to recycle workers during a reload via SIGHUP."""
    print("🔄 Reloading workers...")

def when_ready(server):
    """Called just after the server is started."""
    print(f"✅ Server is ready. Listening on {bind}")
    print(f"👷 Running with {workers} workers")
    

def worker_int(worker):
    """Called just after a worker exited on SIGINT or SIGQUIT."""
    print(f"⚠️  Worker received INT or QUIT signal: {worker.pid}")

def worker_abort(worker):
    """Called when a worker received the SIGABRT signal."""
    print(f"❌ Worker received SIGABRT signal: {worker.pid}")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    print(f"✨ Worker spawned (pid: {worker.pid})")

def post_worker_init(worker):
    """Called just after a worker has initialized the application."""
    print('✨✨ Worker initialized.')
    

def worker_exit(server, worker):
    """Called just after a worker has been exited."""
    print(f"👋 Worker exited (pid: {worker.pid})")

def child_exit(server, worker):
    """Called just after a worker has been exited, in the master process."""
    pass

def nworkers_changed(server, new_value, old_value):
    """Called just after num_workers has been changed."""
    print(f"📊 Number of workers changed from {old_value} to {new_value}")

def on_exit(server):
    """Called just before exiting Gunicorn."""
    print("👋 Shutting down Doctor Appointment Backend Server...")

# SSL (if needed in production)
# keyfile = None
# certfile = None
