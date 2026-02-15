#!/bin/bash
set -e  # Exit on error

echo "🔧 Starting production build..."

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Step 2: Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Step 3: Compile TypeScript
echo "⚙️  Compiling TypeScript..."
npx tsc

# Step 4: Verify build
echo "✅ Verifying build output..."
if [ -f "dist/index.js" ]; then
  echo "✅ Build successful! dist/index.js exists"
  ls -la dist/
else
  echo "❌ Build failed! dist/index.js not found"
  exit 1
fi

echo "🎉 Production build completed successfully!"
