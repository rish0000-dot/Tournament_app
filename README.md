# 🔥 BLAZESTRIKE — Developer Setup Guide

## Project Structure
```
blazestrike/
├── backend/          ← Node.js API Server
│   ├── src/
│   │   ├── server.js           ← Entry point
│   │   ├── config/
│   │   │   ├── database.js     ← PostgreSQL
│   │   │   └── redis.js        ← Redis cache
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── tournamentController.js
│   │   │   └── walletController.js
│   │   ├── routes/
│   │   │   └── allRoutes.js    ← All routes
│   │   ├── services/
│   │   │   ├── coinService.js
│   │   │   ├── smsService.js
│   │   │   ├── notificationService.js
│   │   │   ├── ocrService.js
│   │   │   ├── storageService.js
│   │   │   └── allServices.js  ← Cron + Socket + Logger
│   │   └── middleware/
│   │       ├── auth.js
│   │       └── validate.js
│   ├── .env.example
│   └── package.json
│
├── frontend/         ← React Native App
│   ├── src/
│   │   ├── App.js
│   │   ├── navigation/AppNavigator.js
│   │   ├── screens/
│   │   │   ├── Auth/ (Login, OTP, Splash, SetupProfile)
│   │   │   ├── Home/ (HomeScreen, BountyScreen)
│   │   │   ├── Tournament/ (List, Detail, SubmitResult)
│   │   │   ├── Wallet/ (WalletScreen, Deposit, Withdraw)
│   │   │   ├── Profile/ (Profile, KYC, Notifications, Missions)
│   │   │   ├── Clan/ (ClanScreen)
│   │   │   └── Leaderboard/
│   │   ├── components/
│   │   │   ├── tournament/TournamentCard.js
│   │   │   ├── wallet/WalletBadge.js
│   │   │   └── common/ModeFilterChip.js
│   │   ├── store/slices/ (auth, wallet, tournaments, ui)
│   │   ├── services/api.js
│   │   └── constants/theme.js
│   └── package.json
│
└── database/
    └── schema.sql    ← Full PostgreSQL schema
```

---

## BACKEND SETUP

### Step 1: Install Dependencies
```bash
cd blazestrike/backend
npm install
```

### Step 2: Setup Database
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE blazestrike;
CREATE USER blazeuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE blazestrike TO blazeuser;
\q

# Run migrations
psql -U blazeuser -d blazestrike -f ../../database/schema.sql
```

### Step 3: Setup Redis
```bash
sudo apt install redis-server
sudo systemctl start redis
```

### Step 4: Environment Variables
```bash
cp .env.example .env
# Edit .env with your actual keys:
nano .env
```

**Required API Keys to get:**
- **Razorpay:** razorpay.com → Dashboard → API Keys
- **Fast2SMS:** fast2sms.com → Developer API
- **Google Cloud Vision:** console.cloud.google.com → Enable Vision API
- **Firebase:** console.firebase.google.com → Project Settings → Service Account
- **AWS S3:** aws.amazon.com → IAM → Create user with S3 access

### Step 5: Run Backend
```bash
npm run dev   # Development
npm start     # Production
```

### Step 6: Create Admin Key
Add to .env:
```
ADMIN_SECRET_KEY=your_super_secret_admin_key_here
```

---

## FRONTEND SETUP

### Step 1: Install React Native CLI
```bash
npm install -g react-native-cli
```

### Step 2: Install Dependencies
```bash
cd blazestrike/frontend
npm install
```

### Step 3: Update API URL
In `src/constants/theme.js`:
```js
export const API_BASE_URL = 'http://YOUR_SERVER_IP:5000/api';
// For Android emulator: http://10.0.2.2:5000/api
// For production: https://api.blazestrike.gg/api
```

### Step 4: Link Native Modules
```bash
# Android
cd android && ./gradlew clean && cd ..

# iOS (Mac only)
cd ios && pod install && cd ..
```

### Step 5: Add Custom Fonts (Optional but recommended)
Download from Google Fonts:
- Orbitron (for logo/headings)
- Rajdhani (for labels)
- Barlow (for body text)

Place in `android/app/src/main/assets/fonts/`

### Step 6: Firebase Setup
1. Create project at console.firebase.google.com
2. Download `google-services.json`
3. Place in `android/app/google-services.json`

### Step 7: Razorpay Setup
1. Install: `npm install react-native-razorpay`
2. Add to `android/app/build.gradle`: `implementation 'com.razorpay:checkout:1.6.33'`

### Step 8: Run App
```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

---

## PRODUCTION DEPLOYMENT

### Backend (AWS EC2)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name blazestrike-api

# Setup Nginx reverse proxy
# Point domain: api.blazestrike.gg → localhost:5000
```

### SSL Certificate
```bash
sudo certbot --nginx -d api.blazestrike.gg
```

### Database Backup
```bash
# Automated daily backup
pg_dump blazestrike > backup_$(date +%Y%m%d).sql
```

---

## API ENDPOINTS REFERENCE

### Auth
```
POST /api/auth/send-otp       { phone }
POST /api/auth/verify-otp     { phone, otp, fcm_token }
POST /api/auth/setup-profile  { username, ff_uid, ff_username, referral_code? }
POST /api/auth/logout
```

### Tournaments
```
GET  /api/tournaments          ?mode=&is_free=&limit=&offset=
GET  /api/tournaments/my
GET  /api/tournaments/:id
POST /api/tournaments/:id/join { payment_method }
POST /api/tournaments/:id/result  (multipart: screenshot + kills + rank)
```

### Wallet
```
GET  /api/wallet
POST /api/wallet/deposit/initiate  { amount }
POST /api/wallet/deposit/confirm   { razorpay_order_id, payment_id, signature }
POST /api/wallet/withdraw          { amount, method, upi_id? }
POST /api/wallet/redeem-coins      { coins }
```

### Coins
```
POST /api/coins/ad-watch
GET  /api/coins/missions
GET  /api/coins/history
```

### Clans
```
POST /api/clans              { name, tag, description }
POST /api/clans/:id/join
GET  /api/clans/leaderboard
```

### Admin (requires X-Admin-Key header)
```
POST   /api/admin/tournament
PATCH  /api/admin/tournament/:id/room   { room_id, room_password }
GET    /api/admin/results/pending
PATCH  /api/admin/result/:id/verify    { action: 'approve'|'reject' }
PATCH  /api/admin/user/:id/ban         { reason, permanent }
```

---

## THIRD PARTY COSTS (Monthly estimate at 10K users)

| Service | Cost/month |
|---|---|
| AWS EC2 (t3.medium) | ₹3,500 |
| AWS S3 (100GB) | ₹800 |
| PostgreSQL RDS | ₹4,000 |
| Redis | ₹1,500 |
| Fast2SMS (OTP) | ₹2,000 |
| Google Vision API | ₹500 |
| Firebase (free tier) | ₹0 |
| Razorpay (2% per txn) | Variable |
| **Total** | **~₹12,300/month** |

---

## SUPPORT

WhatsApp: [Your Number]
Email: dev@blazestrike.gg

*Built with ❤️ for BlazeStrike*
