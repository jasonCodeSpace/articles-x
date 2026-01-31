#!/bin/bash
# Deployment script for Racknerd server

SERVER="root@148.135.5.76"
REMOTE_DIR="/root/xarticle-full"
LOCAL_DIR="/Users/haochengwang/Desktop/claude/xarticle"

echo "========================================"
echo "Deploying to Racknerd Server"
echo "========================================"

# Files and directories to exclude from rsync
EXCLUDES="
  --exclude=.next
  --exclude=node_modules
  --exclude=.git
  --exclude=out
  --exclude=.DS_Store
  --exclude=*.log
  --exclude=.claude
  --exclude=.sqlite
"

# Copy only necessary files
echo "Copying files to server..."
rsync -avz $EXCLUDES "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

# Restart PM2 processes
echo "Restarting PM2 processes..."
ssh $SERVER "cd $REMOTE_DIR && pm2 reload all --update-env"

echo "========================================"
echo "Deployment complete!"
echo "========================================"
