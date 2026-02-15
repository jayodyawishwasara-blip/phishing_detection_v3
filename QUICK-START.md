# 🚀 QUICK START - 3 Steps to Deploy

## 📦 ALL FILES INCLUDED

This package contains **12 files** - everything you need:

```
COMPLETE-PACKAGE/
├── README.md                           ← Overview
├── QUICK-START.md                      ← This file
│
├── backend/                            ← Backend (3 files)
│   ├── server.js                       ← Full detection engine + auth
│   ├── package.json                    ← All dependencies
│   └── ecosystem.config.js             ← PM2 configuration
│
├── frontend/                           ← Frontend (6 files)
│   ├── App.js                          ← Complete UI with all tabs
│   ├── index.js                        ← React entry point
│   ├── index.css                       ← Tailwind CSS setup
│   ├── package.json                    ← Frontend dependencies
│   ├── tailwind.config.js              ← Tailwind v3 config
│   └── postcss.config.js               ← PostCSS config
│
└── configs/                            ← Configuration (2 files)
    ├── Caddyfile                       ← Reverse proxy config
    └── deploy.sh                       ← Automated deployment
```

---

## ⚡ 3-STEP DEPLOYMENT

### Step 1: Download Package

Download the **COMPLETE-PACKAGE** folder from Claude (it's already in the outputs above).

---

### Step 2: Upload to VPS

```bash
# From your local machine where you downloaded the package
scp -r COMPLETE-PACKAGE root@194.233.84.223:~/
```

This uploads all 12 files in one go!

---

### Step 3: Run Deployment

```bash
# SSH to your VPS
ssh root@194.233.84.223

# Navigate to package
cd ~/COMPLETE-PACKAGE/configs

# Make script executable (if not already)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

---

## ⏱️ Wait 15-20 Minutes

The script will:
1. ✅ Install Node.js 20.x, PM2, Caddy
2. ✅ Install all dependencies (backend + frontend)
3. ✅ Build production frontend with Tailwind CSS
4. ✅ Setup SQLite database with auth
5. ✅ Configure services and firewall
6. ✅ Start everything

---

## 🌐 Access Dashboard

After deployment completes, open your browser:

**URL:** http://194.233.84.223

**Login:**
- Username: `admin`
- Password: `phishdish`

---

## ✅ What You Get

### Authentication
- ✅ Login/logout system
- ✅ JWT tokens
- ✅ Session management

### UI Tabs (All Working)
- ✅ **Offense** - Domain prediction + watchlist
- ✅ **Analysis** - 5-method detection breakdown
- ✅ **Monitoring** - Automated hourly scanning
- ✅ **Baseline** - Baseline management
- ✅ **Settings** - Configuration

### Detection Engine
- ✅ **Visual Similarity** (30% weight)
- ✅ **Text Similarity** (30% weight)
- ✅ **DOM Structure** (20% weight)
- ✅ **Brand Keywords** (20% weight)
- ✅ Weighted composite scoring

### Database
- ✅ SQLite for persistence
- ✅ Users table
- ✅ Domains table
- ✅ Check logs table

### Design
- ✅ Tailwind CSS v3 (proper styling)
- ✅ Beautiful dark theme
- ✅ Responsive design

---

## 🔍 Verify Everything Works

After logging in:

1. **Check all tabs load:**
   - Click each tab (Offense, Analysis, Monitoring, Baseline, Settings)
   - All should show proper content with styling

2. **Test domain addition:**
   - Go to Offense tab
   - Add domain: `combank-verify.com`
   - Click "Add to Watchlist"

3. **Test detection:**
   - Click "Scan" on the added domain
   - Wait 20-30 seconds
   - Should show similarity score

4. **Check Analysis tab:**
   - Go to Analysis tab
   - Should show breakdown of 5 methods
   - Visual graphs for each method

5. **Test monitoring:**
   - Go to Monitoring tab
   - Click "Start Monitoring"
   - Should show "Monitoring Active"

---

## 🐛 If Something Goes Wrong

### CSS not loading (plain white page)
```bash
cd /opt/phishing-defense/frontend
npm list tailwindcss
# Should show: tailwindcss@3.4.1
# If not, reinstall
npm install -D tailwindcss@^3.4.1
npm run build
```

### Backend not starting
```bash
pm2 logs phishing-defense --lines 50
# Check for errors
```

### Can't login
```bash
# Check database
sqlite3 /opt/phishing-defense/phishing-data/phishing-defense.db "SELECT * FROM users;"
# Should show admin user
```

### Caddy not working
```bash
sudo systemctl status caddy
sudo journalctl -u caddy -n 50
```

---

## 📊 Complete System Architecture

```
Browser (http://194.233.84.223)
    ↓
Caddy (Port 80)
    ├→ /api/auth/login → Authentication (no token needed)
    ├→ /api/* → Backend (JWT token required)
    │           ↓
    │     Enhanced Detection Engine
    │     ├─ Baseline Manager
    │     │  └─ Hourly crawl of combankdigital.com
    │     ├─ 5-Method Detection
    │     │  ├─ Visual (30%)
    │     │  ├─ Text (30%)
    │     │  ├─ DOM (20%)
    │     │  └─ Keywords (20%)
    │     └─ SQLite Database
    │        ├─ users
    │        ├─ domains
    │        └─ check_logs
    │
    ├→ /screenshots/* → Static files
    └→ /* → Frontend (React + Tailwind)
```

---

## 🎯 Success Checklist

After deployment:

- [ ] Dashboard loads at http://194.233.84.223
- [ ] Login page has proper styling (dark theme, rounded corners)
- [ ] Can login with admin/phishdish
- [ ] All 5 tabs are visible and clickable
- [ ] Can add domains to watchlist
- [ ] Scan button works and shows similarity scores
- [ ] Analysis tab shows 5-method breakdown
- [ ] Monitoring can be started/stopped
- [ ] Baseline tab shows config
- [ ] No errors in browser console
- [ ] `pm2 status` shows backend online
- [ ] `sudo systemctl status caddy` shows active

---

## 🔧 Quick Commands

```bash
# View backend logs
pm2 logs phishing-defense

# Restart backend
pm2 restart phishing-defense

# Restart Caddy
sudo systemctl restart caddy

# Check database
sqlite3 /opt/phishing-defense/phishing-data/phishing-defense.db

# Rebuild frontend (if CSS breaks)
cd /opt/phishing-defense/frontend
npm run build
sudo systemctl restart caddy
```

---

## 🎉 That's It!

**3 steps:**
1. Download package
2. Upload to VPS
3. Run deploy.sh

**15-20 minutes later:**
✅ Complete phishing detection platform with all features working!

---

## 📞 Support

If you encounter issues:
1. Check the error logs (see Quick Commands above)
2. Verify all files uploaded correctly
3. Ensure you ran deploy.sh from ~/COMPLETE-PACKAGE/configs/

The deployment script is fully automated and handles everything!
