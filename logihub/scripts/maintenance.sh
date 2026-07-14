#!/bin/bash
set -e

# Determine the absolute path of the project directory based on this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUPS_DIR="$PROJECT_DIR/backups"

echo "========================================="
echo " Starting LogiHub Maintenance Routine"
echo " Timestamp: $(date)"
echo "========================================="

# Ensure we operate in the project directory
cd "$PROJECT_DIR"

# 1. Backups Phase
echo "=> [1/3] Running Database Backup"
mkdir -p "$BACKUPS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUPS_DIR/db_backup_$TIMESTAMP.dump"

echo "Creating pg_dump..."
# Output pg_dump (custom compressed format) directly to the host filesystem
if docker exec logihub_db pg_dump -U logihub -Fc logihub > "$BACKUP_FILE"; then
    echo "Backup successful: $BACKUP_FILE"
else
    echo "ERROR: Backup failed! Halting maintenance script to prevent purging old backups."
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo "Cleaning up backups older than 7 days..."
find "$BACKUPS_DIR" -type f -name "*.dump" -mtime +7 -delete

# 2. Log Cleanup Phase
echo "=> [2/3] Cleaning up old application logs"
echo "Removing scattered .log files older than 7 days..."
find "$PROJECT_DIR" -type f -name "*.log" ! -path "*/node_modules/*" -mtime +7 -delete
echo "Note: Docker container logs are natively rotated via docker-compose configuration."

# 3. Health Check & Restart Phase
echo "=> [3/3] Checking Application Health"
# Try to hit the healthcheck endpoint. Allow 5 seconds max time.
if curl -s -f --max-time 5 http://localhost:8000/health > /dev/null; then
    echo "Backend is healthy."
else
    echo "WARNING: Backend health check failed or timed out!"
    echo "Restarting the Docker stack..."
    # If the docker stack name is not standard, we just restart in the project dir
    docker compose restart
    echo "Restart command issued."
fi

echo "========================================="
echo " Maintenance Routine Complete"
echo "========================================="
