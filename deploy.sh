#!/bin/bash
set -e

# Configuration
DROPLET_IP="your_droplet_ip"
DROPLET_USER="root"
PROJECT_DIR="/opt/logihub"
GIT_REPO_URL="your_git_repository_url"
DOMAIN="yourdomain.com" # Required for SSL and next.js build

echo "========================================="
echo " Deploying LogiHub to DigitalOcean Droplet "
echo "========================================="

# Check if variables are set
if [ "$DROPLET_IP" = "your_droplet_ip" ]; then
    echo "ERROR: Please configure DROPLET_IP in deploy.sh"
    exit 1
fi

if [ "$DOMAIN" = "yourdomain.com" ]; then
    echo "WARNING: DOMAIN is set to yourdomain.com. Please configure it for proper SSL."
fi

# SSH into the droplet and execute deployment commands
ssh $DROPLET_USER@$DROPLET_IP << EOF
    set -e
    
    echo "=> Ensuring project directory exists"
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR

    echo "=> Pulling latest code"
    if [ ! -d ".git" ]; then
        echo "=> Cloning repository for the first time..."
        git clone $GIT_REPO_URL .
    else
        echo "=> Pulling latest changes..."
        git pull origin main
    fi

    echo "=> Setting up environment variables"
    # Create a production .env file if it doesn't exist
    if [ ! -f "logihub/.env" ]; then
        echo "=> Creating logihub/.env from example"
        cp logihub/.env.example logihub/.env
        echo "PLEASE NOTE: You need to edit logihub/.env on the server to add real secrets!"
    fi

    # Set the DOMAIN inside the .env file if not present
    if ! grep -q "DOMAIN=" logihub/.env; then
        echo "DOMAIN=$DOMAIN" >> logihub/.env
    else
        # Update DOMAIN if it already exists
        sed -i 's/^DOMAIN=.*/DOMAIN=$DOMAIN/' logihub/.env
    fi

    echo "=> Building and starting Docker containers in production mode"
    cd logihub
    docker compose -f docker-compose.prod.yml pull || true
    docker compose -f docker-compose.prod.yml up -d --build
    
    echo "=> Cleaning up unused Docker resources"
    docker system prune -f
    
    echo "=> Deployment completed successfully!"
EOF

echo "Done!"
