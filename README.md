# Tos Rean API

Backend REST API for Tos Rean e-learning platform.
Generated based on internal documentation.

## Tech Stack
- Node.js & Express.js
- Prisma ORM
- PostgreSQL
- TypeScript

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup Database:
   - Ensure PostgreSQL is running.
   - Update `.env` with your `DATABASE_URL` (default set to `tos_rean_db`).
   - Run migrations:
     ```bash
     npx prisma migrate dev --name init
     ```

3. Run Server:
   - Development:
     ```bash
     npm run dev
     ```
   - Production:
     ```bash
     npm run build
     npm start
     ```

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Protected)

### Courses
- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses` (Protected)
- `PUT /api/courses/:id` (Protected)
- `DELETE /api/courses/:id` (Protected)

### Lessons
- `GET /api/courses/:courseId/lessons`
- `POST /api/courses/:courseId/lessons` (Protected)
- `PUT /api/courses/:courseId/lessons/:lessonId` (Protected)
- `DELETE /api/courses/:courseId/lessons/:lessonId` (Protected)

### Enrollment
- `POST /api/enrollments/checkout` (Protected)
- `POST /api/enrollments/webhook/payway`
