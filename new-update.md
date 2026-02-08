# New API Updates & Clarifications for Frontend

The following updates and clarifications address the latest feedback and roadmap needs.

---

## 🛠 Clarifications on Current Implementations

### 1. Lesson Content Deletion (bulk-save)
- **Behavior**: When `POST /api/courses/:courseId/lessons/bulk-save` is called, the backend **physically deletes** all previous lesson records associated with that `courseId` and replaces them with the new array.
- **Reason**: This ensures that the lesson ordering and content exactly match what the instructor sees in the Course Wizard without complex diffing logic.

### 2. Payment Success Webhook
- **Endpoint**: `POST /api/enrollments/webhook/payway`
- **Logic**: This is the dedicated handler for the ABA PayWay `post_url`. When a successful payment status (`00` or `SUCCESS`) is received, the backend automatically:
    1. Updates the `Transaction` status to `SUCCESS`.
    2. Upserts an `Enrollment` record for the student and course.
- **Post-Payment**: Students will immediately see the course in their "My Learning" dashboard.

### 3. Video Hosting
- **URL Handling**: The `videoUrl` field in Lessons and Courses is a generic `string`.
- **Recommendation**: Instructors should provide links from YouTube, Vimeo, or S3/Cloudfront. The frontend should use its preferred player (e.g., `react-player`) to render these based on the URL type.

---

## 🚀 Newly Implemented: Wishlist Service

Students can now save courses to their wishlist for later.

### 1. Get My Wishlist
- **URL**: `GET /api/wishlist`
- **Auth**: Required (Bearer Token)
- **Response**: List of wishlisted courses with instructor details.

### 2. Add to Wishlist
- **URL**: `POST /api/wishlist`
- **Payload**: `{ "courseId": "uuid" }`
- **Auth**: Required

### 3. Remove from Wishlist
- **URL**: `DELETE /api/wishlist/:courseId`
- **Auth**: Required

---

## 📑 General Status
- **Port**: `3300`
- **Base URL**: `http://localhost:3300/api`
- **Roles/Enums**: Strictly Uppercase (`STUDENT`, `BEGINNER`, etc.).
- **Categories**: Dynamic list available at `GET /api/categories`.
- **Technical Docs**: Fully detailed endpoints available in `API_TECHNICAL_DOC.md`.
