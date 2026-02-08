# Frontend API Service Implementation Guide

This document provides instructions for the frontend team to implement services for the Tos Rean API.

**Base URL:** `http://localhost:3300/api`

---

## 1. Authentication Service (`AuthService`)

### Sync Firebase with Backend
Call this immediately after a successful Google/Firebase login.
- **Endpoint**: `POST /auth/sync`
- **Payload**: `{ idToken: string }`
- **Logic**: Store the returned `token` in `localStorage` or a cookie. Use this JWT for all subsequent requests.

### Get Current User
- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`

---

## 2. Course Service (`CourseService`)

### List Courses
- **Endpoint**: `GET /courses`
- **Query Params**: `page`, `limit`, `search`, `category`, `level`, `price`
- **Response**: Paginated course list with `lessonsCount`, `studentsCount`, and `rating`.

### Course Details
- **Endpoint**: `GET /courses/:id`
- **Response**: Full course object including `lessons` and `instructor`.

### Reviews
- **List Reviews**: `GET /courses/:id/reviews`
- **Submit Review**: `POST /courses/:id/reviews`

### Categories
- **Get All**: `GET /categories` (Useful for filtering).

### Course Wizard (Admin/Instructor)
- **Step 1 (Create)**: `POST /courses` -> Returns `courseId`.
- **Steps 2-4 (Update)**: `PATCH /courses/:id` (Send partial updates).
- **Curriculum**: `POST /courses/:courseId/lessons/bulk-save` (Efficiently saves all lessons at once).

---

## 3. Student Service (`StudentService`)

### My Learning
- **Endpoint**: `GET /enrollments/my-learning`
- **Returns**: Courses the student is currently enrolled in.

### Learning Mode
- **Endpoint**: `GET /enrollments/:courseId/learn`
- **Constraint**: Only works if enrolled. Returns course content with private lesson details.

### Progress Tracking
- **Endpoint**: `POST /enrollments/:courseId/progress`
- **Payload**: `{ lessonId: string, completed: boolean }`
- **Response**: Updated `progress` percentage.

### Certificates
- **Endpoint**: `GET /enrollments/:courseId/certificate`
- **Constraint**: Progress must be 100%.

---

## 4. Admin Service (`AdminService`)

### Dashboard Stats
- **Endpoint**: `GET /admin/stats`
- **Returns**: Revenue, MAU, and Top Courses.

### User Management
- **Endpoint**: `GET /admin/users`
- **Endpoint**: `PATCH /admin/users/:id/role` (Update to ADMIN/INSTRUCTOR/STUDENT).

---

## 5. Utility Service

### File Upload
- **Endpoint**: `POST /upload`
- **Format**: `multipart/form-data`
- **Field Name**: `file`
- **Returns**: `{ url: "/uploads/..." }`

---

## Axios Interceptor Recommendation

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3300/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```
