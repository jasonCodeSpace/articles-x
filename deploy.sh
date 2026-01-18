#!/bin/bash
#
# Deploy script for Racknerd server
# Usage: ./deploy.sh
#

set -e

# Server configuration
SERVER="root@148.135.5.76"
REMOTE_DIR="/root/xarticle"
LOCAL_DIR="$(pwd)"

echo "========================================="
echo "Deploying to Racknerd Server"
echo "========================================="
echo "Server: $SERVER"
echo "Remote dir: $REMOTE_DIR"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build TypeScript (optional for tsx, but good for type checking)
echo -e "${YELLOW}[1/5]${NC} Type checking..."
npm run build:server 2>/dev/null || echo "Skipping build (using tsx on server)"

# Step 2: Create necessary directories on server
echo -e "${YELLOW}[2/5]${NC} Creating directories..."
ssh $SERVER "mkdir -p $REMOTE_DIR/{scripts,lib,logs}"

# Step 3: Copy files
echo -e "${YELLOW}[3/5]${NC} Copying files..."
# Use rsync to sync files
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='logs' \
  --exclude='public' \
  --exclude='app' \
  --exclude='components' \
  --exclude='*.md' \
  $LOCAL_DIR/ $SERVER:$REMOTE_DIR/

# Step 4: Copy .env.local as .env
echo -e "${YELLOW}[4/5]${NC} Setting up environment..."
if [ -f ".env.local" ]; then
  scp .env.local $SERVER:$REMOTE_DIR/.env
  echo "Environment file copied"
else
  echo "Warning: .env.local not found!"
fi

# Step 5: Install dependencies on server
echo -e "${YELLOW}[5/5]${NC} Installing dependencies..."
ssh $SERVER "cd $REMOTE_DIR && npm install --production"

# Step 6: Restart PM2 apps
echo -e "${YELLOW}[6/6]${NC} Restarting PM2 apps..."
ssh $SERVER << 'ENDSSH'
cd /root/xarticle

# Stop existing apps
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start apps
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
pm2 list
ENDSSH

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Check logs with: ssh $SERVER 'pm2 logs'"
