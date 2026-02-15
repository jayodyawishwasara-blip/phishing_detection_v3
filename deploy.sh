#!/bin/bash

# ============================================================================
# COMPLETE DEPLOYMENT SCRIPT
# Phishing Defense Platform - All Features
# ============================================================================

set -e

PUBLIC_IP="194.233.84.223"
APP_DIR="/opt/phishing-defense"
PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "============================================================================"
echo "   Phishing Defense Platform - Complete Deployment"
echo "   Package location: $PACKAGE_DIR"
echo "============================================================================"
echo ""

# ============================================================================
# Step 1: Clean Previous Installation
# ============================================================================
echo "Step 1: Cleaning previous installation..."

if [ -d "$APP_DIR" ]; then
    read -p "Remove existing installation? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 delete phishing-defense 2>/dev/null || true
        sudo rm -rf "$APP_DIR"
        echo "✅ Cleaned"
    else
        echo "❌ Cancelled"
        exit 1
    fi
fi

# ============================================================================
# Step 2: Install Prerequisites
# ============================================================================
echo ""
echo "Step 2: Installing prerequisites..."

sudo apt update

# Install Node.js 20.x
if ! command -v node &> /dev/null || [[ $(node --version) < "v20" ]]; then
    sudo apt remove -y nodejs npm 2>/dev/null || true
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2
sudo npm install -g pm2

# Install system dependencies
sudo apt install -y build-essential git bc python3 sqlite3 libsqlite3-dev

# Install Chromium dependencies for Ubuntu 24.04
UBUNTU_VERSION=$(lsb_release -rs)
sudo apt-get install -y ca-certificates fonts-liberation wget xdg-utils lsb-release

if [[ $(echo "$UBUNTU_VERSION >= 24.04" | bc -l) -eq 1 ]]; then
    sudo apt-get install -y \
        libappindicator3-1 libasound2t64 libatk-bridge2.0-0t64 \
        libatk1.0-0t64 libc6 libcairo2 libcups2t64 libdbus-1-3 \
        libexpat1 libfontconfig1 libgbm1 libgcc-s1 libglib2.0-0t64 \
        libgtk-3-0t64 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
        libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
        libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
        libxrandr2 libxrender1 libxss1 libxtst6
else
    sudo apt-get install -y \
        libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 \
        libcups2 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
        libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 \
        libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
        libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
fi

# Install Caddy
if ! command -v caddy &> /dev/null; then
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install -y caddy
fi

echo "✅ Prerequisites installed"

# ============================================================================
# Step 3: Create Application Structure
# ============================================================================
echo ""
echo "Step 3: Creating application structure..."

sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

mkdir -p phishing-data/{logs,screenshots,baseline}
mkdir -p backend frontend/src frontend/public

echo "✅ Structure created"

# ============================================================================
# Step 4: Setup Backend
# ============================================================================
echo ""
echo "Step 4: Setting up backend..."

cd $APP_DIR/backend

# Copy backend files
cp "$PACKAGE_DIR/backend/server.js" .
cp "$PACKAGE_DIR/backend/package.json" .
cp "$PACKAGE_DIR/backend/ecosystem.config.js" .

# Install dependencies
echo "Installing backend dependencies (5-7 minutes)..."
npm install

# Add authentication dependencies
npm install jsonwebtoken bcrypt sqlite3

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s/CHANGE_THIS_IN_PRODUCTION/$JWT_SECRET/" ecosystem.config.js

echo "✅ Backend configured"

# ============================================================================
# Step 5: Setup Frontend
# ============================================================================
echo ""
echo "Step 5: Setting up frontend..."

cd $APP_DIR/frontend

# Copy frontend files
cp "$PACKAGE_DIR/frontend/package.json" .
cp "$PACKAGE_DIR/frontend/tailwind.config.js" .
cp "$PACKAGE_DIR/frontend/postcss.config.js" .

mkdir -p src
cp "$PACKAGE_DIR/frontend/App.js" src/
cp "$PACKAGE_DIR/frontend/index.js" src/
cp "$PACKAGE_DIR/frontend/index.css" src/

# Create public/index.html
mkdir -p public
cat > public/index.html << 'HTML'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Phishing Defense Platform" />
    <title>Phishing Defense Platform</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
HTML

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build production
echo "Building frontend (3-5 minutes)..."
CI=false npm run build

echo "✅ Frontend built"

# ============================================================================
# Step 6: Configure Caddy
# ============================================================================
echo ""
echo "Step 6: Configuring Caddy..."

sudo cp "$PACKAGE_DIR/configs/Caddyfile" /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

echo "✅ Caddy configured"

# ============================================================================
# Step 7: Configure Firewall
# ============================================================================
echo ""
echo "Step 7: Configuring firewall..."

sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable 2>/dev/null || true

echo "✅ Firewall configured"

# ============================================================================
# Step 8: Start Services
# ============================================================================
echo ""
echo "Step 8: Starting services..."

# Start backend
cd $APP_DIR/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $USER --hp $(eval echo ~$USER)

# Start Caddy
sudo systemctl restart caddy
sudo systemctl enable caddy

echo "✅ Services started"

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================
echo ""
echo "============================================================================"
echo "   ✅ DEPLOYMENT COMPLETE!"
echo "============================================================================"
echo ""
echo "🌐 Access Dashboard:"
echo "   http://$PUBLIC_IP"
echo ""
echo "🔐 Login Credentials:"
echo "   Username: admin"
echo "   Password: phishdish"
echo ""
echo "📊 System Information:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo "   Application: $APP_DIR"
echo "   JWT Secret: $JWT_SECRET"
echo ""
echo "🔧 Service Management:"
echo "   Backend:  pm2 status"
echo "   Caddy:    sudo systemctl status caddy"
echo ""
echo "📝 Logs:"
echo "   Backend:  pm2 logs phishing-defense"
echo "   Caddy:    sudo journalctl -u caddy -f"
echo ""
echo "✅ Features Enabled:"
echo "   ✓ Authentication (JWT + bcrypt)"
echo "   ✓ SQLite database"
echo "   ✓ 5-Method detection engine"
echo "   ✓ Baseline management"
echo "   ✓ Automated monitoring"
echo "   ✓ All UI tabs working"
echo "   ✓ Tailwind CSS styling"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open http://$PUBLIC_IP in browser"
echo "   2. Login with admin/phishdish"
echo "   3. Add domains to watchlist"
echo "   4. Test detection features"
echo ""
echo "============================================================================"
