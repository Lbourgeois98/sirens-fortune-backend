# Sirens Fortune Backend - Railway Deployment Guide

## 🚀 Step-by-Step Railway Setup

### 1. Prepare Your Repository
```bash
# Create a new repository for your backend
git init
git add .
git commit -m "Initial backend setup"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your backend repository
6. Railway will auto-detect Node.js and deploy

### 3. Set Environment Variables
In Railway dashboard:
1. Go to your project
2. Click "Variables" tab
3. Add these variables:
   ```
   HELIO_PUBLIC_KEY=your_actual_helio_public_key
   HELIO_SECRET_KEY=your_actual_helio_secret_key  
   HELIO_WEBHOOK_SECRET=your_actual_helio_webhook_secret
   NODE_ENV=production
   ```

### 4. Get Your Railway URL
- Railway will provide a URL like: `https://your-app-name.railway.app`
- Your webhook endpoint will be: `https://your-app-name.railway.app/api/helio/webhook`

### 5. Configure Helio Dashboard
1. Login to Helio dashboard
2. Go to Webhooks settings
3. Add webhook URL: `https://your-app-name.railway.app/api/helio/webhook`
4. Select events: payment.completed, payment.failed, withdrawal.completed, withdrawal.failed

### 6. Update Frontend
Update your frontend to use the Railway backend URL instead of the local one.

## 🔧 Local Development
```bash
npm install
cp .env.example .env
# Edit .env with your actual Helio credentials
npm run dev
```

## 📊 Monitoring
- Railway provides logs and metrics in the dashboard
- Health check endpoint: `/health`
- Test webhook processing with `/api/helio/test`

## 🔒 Security Features
- CORS configured for your frontend domain
- Webhook signature verification
- Helmet.js security headers
- Input validation and sanitization