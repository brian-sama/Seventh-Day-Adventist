#!/bin/bash

# ==============================================================================
# Church Service Request System - VPS Deployment Script
# ==============================================================================
# This script automates the deployment process on a Linux VPS (Contabo).
# It handles pulling code, updating dependencies, building the frontend,
# and restarting services.
# ==============================================================================

# Exit on error
set -e

# Detect project root (directory where this script is located)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$PROJECT_ROOT/env"

echo ">>> Starting deployment at $(date)"
echo ">>> Project Root: $PROJECT_ROOT"

# 1. Update Codebase
echo ">>> Pulling latest changes from Git..."
cd $PROJECT_ROOT
git pull origin main

# 2. Update Backend
echo ">>> Updating backend dependencies..."
source $VENV_PATH/bin/activate
cd $PROJECT_ROOT/backend
pip install -r requirements.txt

echo ">>> Running backend migrations..."
python manage.py migrate

echo ">>> Collecting static files..."
python manage.py collectstatic --noinput

# 3. Update Frontend
echo ">>> Building frontend assets..."
cd $PROJECT_ROOT/frontend
npm install
npm run build

# 4. Restart Services
# Note: Assuming your systemd services are named 'gunicorn' and 'nginx'.
# Adjust these names if they differ on your server.
echo ">>> Restarting services..."
sudo systemctl restart gunicorn
sudo systemctl restart nginx

echo ">>> Deployment completed successfully at $(date)!"
echo "=============================================================================="
