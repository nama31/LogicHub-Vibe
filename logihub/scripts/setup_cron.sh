#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MAINTENANCE_SCRIPT="$SCRIPT_DIR/maintenance.sh"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/maintenance.log"

echo "Setting up Cron Job for LogiHub Maintenance"

# Ensure the log directory exists
mkdir -p "$LOG_DIR"

# Check if maintenance.sh is executable
if [ ! -x "$MAINTENANCE_SCRIPT" ]; then
    echo "Making maintenance.sh executable..."
    chmod +x "$MAINTENANCE_SCRIPT"
fi

# The cron command we want to add (Runs daily at 3:00 AM)
CRON_CMD="0 3 * * * $MAINTENANCE_SCRIPT >> $LOG_FILE 2>&1"

# Check if it already exists
if crontab -l 2>/dev/null | grep -q "$MAINTENANCE_SCRIPT"; then
    echo "Cron job already exists! Current crontab:"
    crontab -l | grep "$MAINTENANCE_SCRIPT"
else
    # Append the new cron job
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    echo "Cron job successfully added."
    echo "It will run daily at 3:00 AM."
    echo "Logs will be appended to: $LOG_FILE"
fi
