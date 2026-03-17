#!/bin/bash

# ==============================================================================
# Local-to-VPS Push & Deploy Script
# ==============================================================================
# This script automates the flow: Git Push -> SSH into VPS -> Run deploy.sh
# Usage: ./push_deploy.sh [vps_ip] [project_path_on_vps]
# ==============================================================================

# Default Configuration (Adjust these to your setup)
VPS_USER="brian"
VPS_IP="89.116.26.24"
REMOTE_PROJECT_PATH="/home/brian/Seventh-Day-Adventist"

# Check if arguments are provided, otherwise use defaults/prompt
IP=${1:-$VPS_IP}
REMOTE_PATH=${2:-$REMOTE_PROJECT_PATH}

if [ -z "$IP" ] || [ -z "$REMOTE_PATH" ]; then
    echo "Usage: ./push_deploy.sh [VPS_IP] [REMOTE_PROJECT_PATH]"
    echo "Or set the VPS_IP and REMOTE_PROJECT_PATH variables inside this script."
    exit 1
fi

echo ">>> Pushing local changes to Git..."
git push origin main

echo ">>> Connecting to $IP and triggering deployment..."
ssh "$VPS_USER@$IP" "cd $REMOTE_PATH && ./deploy.sh"

echo ">>> Remote deployment trigger completed!"
