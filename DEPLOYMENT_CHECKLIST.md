# Pre-Deployment Checklist ✅

## Before Pushing to GitHub

- [x] `render.yaml` configuration created
- [x] Build scripts updated (`build` for local, `build:prod` for Render)
- [x] `.gitignore` updated to exclude sensitive files
- [x] `uploads/.gitkeep` created for persistent folder
- [ ] Test local build: `npm run build` ✅ (Completed successfully)

## Environment Variables to Set in Render

Copy these to Render Dashboard → Environment tab:

```bash
NODE_ENV=production
DATABASE_URL=<your_database_connection_string>
JWT_SECRET=<generate_a_strong_secret>
FIREBASE_PROJECT_ID=cambonexthub
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@cambonexthub.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="<your_firebase_private_key>"
```

## Database Options

Choose one:

- [ ] **Render PostgreSQL** (90 days free, then $7/month)
- [ ] **Neon** (Free forever tier available)
- [ ] **Supabase** (Free tier available)

## Deployment Steps

1. [ ] Push code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. [ ] Go to [render.com](https://render.com) and sign up

3. [ ] Create New Web Service → Connect GitHub repo

4. [ ] Set environment variables (see above)

5. [ ] Click "Create Web Service"

6. [ ] Wait for build to complete (~3-5 minutes)

7. [ ] Test your API at: `https://tos-rean-api.onrender.com/api`

## Post-Deployment Testing

Test these endpoints:

```bash
# Replace YOUR_URL with your Render URL
export API_URL="https://tos-rean-api.onrender.com/api"

# Test registration
curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test login
curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

## Known Limitations (Free Tier)

⚠️ **Service sleeps after 15 minutes of inactivity**
- First request after sleep takes ~30 seconds
- Solution: Upgrade to Starter ($7/month) or use UptimeRobot to ping every 5 minutes

⚠️ **Disk storage is ephemeral**
- Uploaded files persist but are lost on redeploy
- Solution: Upgrade to Starter plan or use cloud storage (Cloudinary/S3)

## Upgrade Recommendations

For production use, consider:
- [ ] Upgrade to **Starter Plan** ($7/month) for:
  - No sleep
  - Persistent disk storage
  - Better performance
  
- [ ] Implement cloud storage for uploads:
  - Cloudinary (easiest)
  - AWS S3
  - Supabase Storage

## 📚 Documentation

- Full guide: `RENDER_DEPLOYMENT.md`
- Render config: `render.yaml`
- Package scripts: `package.json`

---

**Ready to deploy! 🚀**

Follow the steps in `RENDER_DEPLOYMENT.md` for detailed instructions.
