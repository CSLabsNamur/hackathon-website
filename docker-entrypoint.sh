#!/bin/bash
set -euo pipefail

log() {
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

log "Starting entrypoint script"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  log "Error: npm is not installed or not in PATH"
  exit 1
fi

log "Running migrations"
if npm run db:deploy; then
  log "Migrations completed successfully"
else
  log "Error: Migrations failed"
  exit 1
fi

log "Running seed"
if npm run db:seed; then
  log "Seed completed successfully"
else
  log "Error: Seed failed"
  exit 1
fi

log "Entrypoint script completed."
exit 0
