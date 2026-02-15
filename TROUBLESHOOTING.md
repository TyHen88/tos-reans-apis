# 🔧 Troubleshooting: "Cannot find module" Error

## Problem
```
Error: Cannot find module '/opt/render/project/src/index.js'
```

## Root Cause
This error occurs when:
1. The TypeScript build (`tsc`) didn't run successfully
2. The `dist/` folder wasn't created
3. Database migration failed and stopped the build process

## ✅ Solution Implemented

We've created a robust `build.sh` script that:
- ✅ Runs each build step separately
- ✅ Verifies the `dist/index.js` file exists
- ✅ Provides clear error messages
- ✅ Exits immediately if any step fails

## Build Process

The `build.sh` script runs these steps in order:

```bash
1. npx prisma generate     # Generate Prisma Client
2. npx prisma migrate deploy  # Run database migrations ✅
3. npx tsc                 # Compile TypeScript
4. Verify dist/index.js exists
```

## What to Check on Render

### 1. Check Build Logs

In Render Dashboard → Your Service → Logs, look for:

```
✅ Build successful! dist/index.js exists
```

If you see this, the build worked correctly.

### 2. Common Build Failures

**❌ "Authentication failed" during migration**
- **Cause:** `DATABASE_URL` not set or incorrect
- **Fix:** Go to Environment tab, verify `DATABASE_URL` is set correctly

**❌ "Prisma schema not found"**
- **Cause:** `prisma/schema.prisma` not in repository
- **Fix:** Make sure to commit the prisma folder:
  ```bash
  git add prisma/
  git commit -m "Add Prisma schema"
  git push
  ```

**❌ TypeScript compilation errors**
- **Cause:** Type errors in your code
- **Fix:** Run `npm run build` locally first to catch errors

### 3. Verify Environment Variables

Make sure these are set in Render:

```
✅ DATABASE_URL=postgresql://...
✅ JWT_SECRET=your_secret
✅ NODE_ENV=production
✅ FIREBASE_PROJECT_ID=...
✅ FIREBASE_CLIENT_EMAIL=...
✅ FIREBASE_PRIVATE_KEY="..."
```

## Manual Build Test (Local)

Test the build script locally:

```bash
# This will fail at migration step if DB is not accessible (expected)
./build.sh

# Or test just the TypeScript compilation:
npm run build
```

## If Build Still Fails on Render

1. **Check the full build logs** in Render Dashboard
2. **Look for the specific error** before "Cannot find module"
3. **Verify all files are committed** to git:
   ```bash
   git status
   git add .
   git commit -m "Fix build"
   git push
   ```

## Alternative: Simpler Build Command

If the script approach doesn't work, you can try this simpler approach in `render.yaml`:

```yaml
buildCommand: npm install && npx prisma generate && npx prisma migrate deploy && npx tsc
```

This does the same thing but inline instead of using a script.

---

**The build script ensures migrations run before starting the server!** ✅
