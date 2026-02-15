# Database Scripts & Migrations

This directory contains utility scripts for database operations.

## SQL Migrations

### Migration: `20260214145846_seed_sample_courses`
**Location:** `prisma/migrations/20260214145846_seed_sample_courses/migration.sql`

A SQL migration that seeds the database with 10 sample courses (5 free and 5 paid).

**Applied via:**
```bash
npx prisma migrate dev
```

**What it does:**
- Creates a default instructor user if none exists (instructor@example.com)
- Inserts 10 courses directly into the database using SQL INSERT statements
- Uses PostgreSQL-specific features (DO blocks, ARRAY types, gen_random_uuid())

**Data inserted:**
- 5 FREE courses (price: $0)
  - Introduction to Web Development (BEGINNER)
  - Git and GitHub Essentials (BEGINNER)
  - Python Programming Basics (BEGINNER)
  - Responsive Web Design Fundamentals (BEGINNER)
  - Introduction to Databases with SQL (BEGINNER)
- 5 PAID courses (prices: $49.99 - $79.99)
  - Advanced React and Next.js Masterclass ($49.99, ADVANCED)
  - Full-Stack Development with Node.js and MongoDB ($59.99, INTERMEDIATE)
  - Machine Learning with Python and TensorFlow ($79.99, ADVANCED)
  - DevOps and Cloud Architecture with AWS ($69.99, INTERMEDIATE)
  - Mobile App Development with React Native ($54.99, INTERMEDIATE)

**Note:** This migration is idempotent for the instructor creation (uses ON CONFLICT DO NOTHING), but will insert duplicate courses if run multiple times.

## JavaScript Utility Scripts

### `seed_courses.js`
Alternative JavaScript-based seeding script (does the same as the migration above).

**Usage:**
```bash
node scripts/seed_courses.js
```

**What it does:**
- Creates a default instructor if none exists
- Inserts 10 courses using Prisma Client
- Provides detailed console output during seeding

**Features:**
- Each course includes:
  - Title, slug, description
  - Thumbnail image URL (Unsplash)
  - Price, level, category, tags
  - Duration, status, ratings
  - Enrollment count
  - Published date

### `seed_lessons.js`
Seeds sample lessons for a specific course.

**Usage:**
```bash
node scripts/seed_lessons.js <course-id>
```

**Example:**
```bash
node scripts/seed_lessons.js 3a716f52-c07f-4a7d-a5e2-00bfd985b7c3
```

**What it does:**
- Validates that the course exists
- Inserts 10 comprehensive lessons for the specified course
- Creates a realistic course curriculum with:
  - 2 FREE preview lessons (Introduction, Setup)
  - 8 PAID lessons (Core content, projects, advanced topics)
  - Total duration: ~4 hours 15 minutes

**Features:**
- Each lesson includes:
  - Title, slug, description
  - Video URL and provider
  - Markdown content
  - Duration (in seconds)
  - Order number
  - Free/Paid status
  - Published status
  - Optional attachments (for project lessons)

**Error handling:**
- Shows available courses if the provided ID doesn't exist
- Warns if lessons already exist for the course
- Provides detailed progress output

### `populate_slugs.js`
Updates existing courses and lessons with slugs if they don't have one.

**Usage:**
```bash
node scripts/populate_slugs.js
```

**What it does:**
- Finds all courses and lessons without slugs
- Generates URL-friendly slugs from titles
- Updates the database records

## Notes

- **SQL Migrations** are the recommended approach for production data seeding
- **JavaScript scripts** are useful for development and testing
- All scripts use Prisma Client to interact with the database
- Make sure your `.env` file has the correct `DATABASE_URL`
- Scripts will automatically disconnect from the database when complete

## Choosing Between Migration vs Script

**Use SQL Migration when:**
- You want the data to be part of your schema history
- You're deploying to production
- You want the data to be automatically applied with `prisma migrate deploy`

**Use JavaScript Script when:**
- You're in development and want flexibility
- You need to seed data multiple times for testing
- You want more control over the seeding process
