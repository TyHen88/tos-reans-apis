# Tos Rean API - Full Technical Documentation

**Base URL**: `http://localhost:3300/api`

---

## 1. Authentication Service (`/auth`)

### Sync Firebase User
Syncs the user from Firebase Auth to the local PostgreSQL database.
- **URL**: `/auth/sync`
- **Method**: `POST`
- **Request Body**:
  ```json
  { "idToken": "string (Firebase ID Token)" }
  ```
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "...", "name": "...", "role": "STUDENT|INSTRUCTOR|ADMIN" },
      "token": "JWT_TOKEN"
    }
  }
  ```

### Get My Profile
- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth Required**: Bearer Token
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": { "id": "...", "email": "...", "role": "...", "avatar": "..." }
  }
  ```

---

## 2. Course Service (`/courses`)

### List Courses (Public)
Fetches published courses with pagination and filters.
- **URL**: `/courses`
- **Method**: `GET`
- **Query Params**: `page`, `limit`, `search`, `category`, `level`
- **Response (200)**:
  ```json
  {
    "success": true,
    "data": [{ "id": "...", "title": "...", "price": 0, "rating": 4.5, "lessonsCount": 10 }],
    "pagination": { "total": 50, "page": 1, "totalPages": 5 }
  }
  ```

### Get Course Details
- **URL**: `/courses/:id`
- **Method**: `GET`
- **Response**: Full course object including instructor bio and lesson list.

### Create Course (Wizard Step 1)
- **URL**: `/courses`
- **Method**: `POST`
- **Auth Required**: Instructor/Admin
- **Request Body**:
  ```json
  { "title": "React Masterclass", "price": 49.99, "level": "BEGINNER" }
  ```

### Update Course (Wizard Logic)
- **URL**: `/courses/:id`
- **Method**: `PATCH`
- **Auth Required**: Instructor/Admin
- **Request Body**: Any partial course fields (thumbnail, description, category, etc.)

---

## 3. Lesson Service (`/courses/:id/lessons`)

### List Lessons
- **URL**: `/courses/:id/lessons`
- **Method**: `GET`

### Bulk Save (Wizard)
- **URL**: `/courses/:id/lessons/bulk-save`
- **Method**: `POST`
- **Payload**: `{ "lessons": [...] }`

---

## 4. Review Service (`/courses/:id/reviews`)

### List Reviews
- **URL**: `/courses/:id/reviews`
- **Method**: `GET`

### Submit Review
- **URL**: `/courses/:id/reviews`
- **Method**: `POST`
- **Auth Required**: Enrolled Student

---

## 5. Category Service (`/categories`)

### Get Unique Categories
- **URL**: `/categories`
- **Method**: `GET`
- **Description**: Returns a dynamic list of existing course categories.

---

## 6. Enrollment & Progress Service (`/enrollments`)

### My Learning
- **URL**: `/enrollments/my-learning`
- **Method**: `GET`
- **Auth Required**: Student
- **Response**: List of enrolled courses with current progress %.

### Course Learning Content
- **URL**: `/enrollments/:courseId/learn`
- **Method**: `GET`
- **Auth Required**: Enrolled Student
- **Response**: Course lessons, video URLs, and student's `completedLessons` IDs.

### Update Progress
- **URL**: `/enrollments/:courseId/progress`
- **Method**: `POST`
- **Request Body**:
  ```json
  { "lessonId": "uuid", "completed": true }
  ```
- **Response**: `{ "success": true, "data": { "progress": 85 } }`

### Get Certificate
- **URL**: `/enrollments/:courseId/certificate`
- **Method**: `GET`
- **Auth Required**: Enrolled Student (100% progress)

---

## 4. Payment Service (ABA PayWay)

### Initiate Checkout
- **URL**: `/enrollments/checkout`
- **Method**: `POST`
- **Request Body**: `{ "courseId": "uuid" }`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "paymentUrl": "https://...",
      "payload": { "hash": "...", "tran_id": "...", "amount": "..." }
    }
  }
  ```

---

## 5. Wishlist Service (`/wishlist`)

### Get My Wishlist
- **URL**: `/wishlist`
- **Method**: `GET`
- **Auth Required**: Student
- **Response**: Array of wishlisted courses.

### Add to Wishlist
- **URL**: `/wishlist`
- **Method**: `POST`
- **Payload**: `{ "courseId": "uuid" }`

### Remove from Wishlist
- **URL**: `/wishlist/:courseId`
- **Method**: `DELETE`

---

## 6. Admin Service (`/admin`)

### Dashboard Stats
- **URL**: `/admin/stats`
- **Method**: `GET`
- **Auth Required**: Admin
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalRevenue": 2500.50,
      "mau": 120,
      "topCourses": [{ "title": "...", "enrollments": 45 }]
    }
  }
  ```

### User List
- **URL**: `/admin/users`
- **Method**: `GET`
- **Auth Required**: Admin

---

## 6. Utilities

### File Upload (Multer)
- **URL**: `/upload`
- **Method**: `POST` (multipart/form-data)
- **Field**: `file` (Image only)
- **Response**: `{ "success": true, "data": { "url": "/uploads/filename.png" } }`

---

## Error Response Standard
All errors follow this format:
```json
{
  "success": false,
  "message": "Human readable error message",
  "error": {} // Optional technical details
}
```
