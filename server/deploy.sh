#!/bin/bash

# Xarticle Server Deployment Script
# Run this on your Racknerd server to set up the cron jobs

set -e

echo "=========================================="
echo "Xarticle Server Deployment"
echo "=========================================="
echo ""

# Configuration
DEPLOY_DIR="/root/xarticle-server"
LOG_DIR="$DEPLOY_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Node.js is installed
echo "📦 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20+ first.${NC}"
    echo "   Run: curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version is too old. Please upgrade to Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"
echo ""

# Step 2: Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$LOG_DIR"
echo -e "${GREEN}✅ Directory created: $DEPLOY_DIR${NC}"
echo ""

# Step 3: Copy files
echo "📋 Copying files..."
cp cron-runner.ts "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp .env "$DEPLOY_DIR/" 2>/dev/null || echo -e "${YELLOW}⚠️  .env file not found. Please create it from .env.example${NC}"
echo -e "${GREEN}✅ Files copied${NC}"
echo ""

# Step 4: Install dependencies
echo "📦 Installing dependencies..."
cd "$DEPLOY_DIR"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 5: Setup crontab
echo "⏰ Setting up crontab..."
read -p "Do you want to install the crontab? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Backup existing crontab
    crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

    # Install new crontab
    crontab crontab
    echo -e "${GREEN}✅ Crontab installed${NC}"
    echo ""
    echo "Current crontab:"
    crontab -l
else
    echo -e "${YELLOW}⏭️  Skipping crontab installation${NC}"
fi
echo ""

# Step 6: Test run
echo "🧪 Running test..."
read -p "Do you want to run a test job now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running article pipeline (test)..."
    npm run pipeline
    echo -e "${GREEN}✅ Test completed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping test${NC}"
fi
echo ""

echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "📍 Deployment directory: $DEPLOY_DIR"
echo "📝 Log directory: $LOG_DIR"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_DIR/pipeline.log"
echo "  tail -f $LOG_DIR/daily-report.log"
echo ""
echo "To manually run jobs:"
echo "  cd $DEPLOY_DIR && npm run pipeline"
echo "  cd $DEPLOY_DIR && npm run daily-report"
echo ""
