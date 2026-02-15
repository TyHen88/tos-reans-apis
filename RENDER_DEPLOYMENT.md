# Render Deployment Guide - TosRean API

## 🚀 Quick Deployment Steps

### 1. Push to GitHub

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for easy integration)

### 3. Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `tos-rean-api`
3. Render will auto-detect the `render.yaml` configuration

### 4. Configure Service

Render should auto-fill these from `render.yaml`, but verify:

- **Name:** `tos-rean-api`
- **Runtime:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** Free (or Starter for $7/month - no sleep)

### 5. Set Environment Variables

Click **"Environment"** tab and add these variables:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_super_secret_jwt_key_here
FIREBASE_PROJECT_ID=cambonexthub
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@cambonexthub.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDDHZ1wV/P4yBph
...
-----END PRIVATE KEY-----"
```

**⚠️ Important Notes:**
- For `FIREBASE_PRIVATE_KEY`, paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the newlines in the private key (Render handles this automatically)
- Get `DATABASE_URL` from your database provider (see Database Setup below)

### 6. Deploy!

Click **"Create Web Service"** and Render will:
1. Clone your repository
2. Run `npm install`
3. Run `prisma generate && prisma migrate deploy && tsc`
4. Start your server with `npm start`

---

## 🗄️ Database Setup Options

### Option 1: Render PostgreSQL (Recommended for Simplicity)

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Name it `tos-rean-db`
3. Select **Free** plan (90 days free, then $7/month)
4. Click **"Create Database"**
5. Copy the **"Internal Database URL"**
6. Paste it as `DATABASE_URL` in your web service environment variables

### Option 2: Neon (Free Forever)

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Use it as `DATABASE_URL`

### Option 3: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use "Session mode" for Prisma)
5. Use it as `DATABASE_URL`

---

## 📁 File Upload Considerations

### Free Tier Limitations

On Render's **free tier**, your service will:
- ✅ Have persistent disk storage (files won't be deleted)
- ⚠️ **But** the disk is ephemeral - files are lost when the service restarts or redeploys
- ⚠️ The service "sleeps" after 15 minutes of inactivity

### Solutions:

**Option A: Upgrade to Starter Plan ($7/month)**
- Persistent disk storage
- No sleep
- Files are safe across deploys

**Option B: Use Cloud Storage (Recommended for Production)**
- Cloudinary (easiest for images)
- AWS S3
- Supabase Storage

For now, the free tier will work for testing, but plan to upgrade or use cloud storage for production.

---

## 🧪 Testing Your Deployment

Once deployed, Render will give you a URL like:
```
https://tos-rean-api.onrender.com
```

Test your API:

```bash
# Health check
curl https://tos-rean-api.onrender.com/api/auth/me

# Register a user
curl -X POST https://tos-rean-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Build fails with "Prisma schema not found"

**Solution:** Make sure `prisma/schema.prisma` is committed to git:
```bash
git add prisma/schema.prisma
git commit -m "Add Prisma schema"
git push
```

### Issue 2: "Cannot connect to database"

**Solution:** 
1. Check `DATABASE_URL` is set correctly in environment variables
2. Make sure your database allows connections from Render's IP ranges
3. If using Render PostgreSQL, use the **Internal Database URL**, not External

### Issue 3: "Module not found" errors

**Solution:** Make sure all dependencies are in `dependencies`, not `devDependencies`:
```bash
npm install --save typescript @types/node @types/express
```

### Issue 4: Service keeps sleeping (free tier)

**Solution:** 
- Upgrade to Starter plan ($7/month)
- Or use a service like [UptimeRobot](https://uptimerobot.com) to ping your API every 5 minutes

### Issue 5: Uploads folder doesn't exist

**Solution:** The `uploads/.gitkeep` file should create the folder automatically. If not:
- Check that `.gitkeep` is committed
- Or add this to your `src/app.ts`:
```typescript
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}
```

---

## 📊 Monitoring & Logs

### View Logs

1. Go to your service in Render Dashboard
2. Click **"Logs"** tab
3. You'll see real-time logs from your application

### Set Up Alerts

1. Go to **"Settings"** → **"Notifications"**
2. Add your email for deploy notifications and errors

---

## 🔄 Auto-Deploy Setup

Render automatically deploys when you push to your main branch.

To disable auto-deploy:
1. Go to **"Settings"** → **"Build & Deploy"**
2. Toggle off **"Auto-Deploy"**

---

## 🌐 Custom Domain (Optional)

1. Go to **"Settings"** → **"Custom Domain"**
2. Add your domain (e.g., `api.tosrean.com`)
3. Update your DNS records as instructed
4. Render provides free SSL certificates automatically

---

## 💰 Cost Breakdown

### Free Tier
- ✅ 750 hours/month (enough for one service)
- ✅ Automatic SSL
- ⚠️ Service sleeps after 15 minutes of inactivity
- ⚠️ Slower cold starts (~30 seconds)

### Starter Plan ($7/month)
- ✅ No sleep
- ✅ Faster performance
- ✅ Persistent disk storage
- ✅ Better for production

---

## 📝 Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Update your frontend to use the Render URL
3. ✅ Set up monitoring/alerts
4. ✅ Consider upgrading to Starter plan for production
5. ✅ Implement cloud storage for file uploads (if needed)

---

## 🔗 Useful Links

- [Render Docs](https://render.com/docs)
- [Deploying Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Prisma with Render](https://render.com/docs/deploy-prisma)
- [Render Status Page](https://status.render.com)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the logs in Render Dashboard
2. Review the [Render Community Forum](https://community.render.com)
3. Check your environment variables are set correctly
4. Ensure your database is accessible

**Your API is ready to deploy! 🚀**
