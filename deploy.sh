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

# --- CONFIGURATION (Adjust these to match your VPS setup) ---
# To find your service names, run: systemctl list-units --type=service | grep -E "gunicorn|sda|church"
BACKEND_SERVICE="sda_backend"  # Updated to match your actual service name
NGINX_SERVICE="nginx"
# -----------------------------------------------------------

echo ">>> Starting deployment at $(date)"
echo ">>> Project Root: $PROJECT_ROOT"

# 0. Infrastructure Setup (One-time)
if ! command -v libreoffice &> /dev/null; then
    echo ">>> LibreOffice not found. Installing for Word -> PDF conversion..."
    sudo apt update && sudo apt install libreoffice -y
fi

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
echo ">>> Restarting services..."
sudo systemctl restart $BACKEND_SERVICE
sudo systemctl restart $NGINX_SERVICE

echo ">>> Deployment completed successfully at $(date)!"
echo "=============================================================================="
