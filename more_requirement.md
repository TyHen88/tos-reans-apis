# Backend API Requirements - Additional Needs

Based on the frontend analysis and the current implementation of the API technical documentation, the following fields, endpoints, or clarifications are required from the backend:

## 1. Course & Lesson Management
- **Bulk Lesson Creation**: The Course Wizard currently saves a list of lessons. We need a specific endpoint or clarification if `PATCH /courses/:id` accepts a `lessons` array, or if `POST /courses/:id/lessons` should handle an array of lessons for initial bulk save.
- **Lesson Attachments**: The frontend supports lesson attachments (`{ name: string; url: string }[]`). Please ensure the `Lesson` entity supports this field (likely as a JSONB field).
- **Course Metadata**: Confirm that `lessonsCount`, `studentsCount`, and `rating` are returned in the `GET /courses` and `GET /courses/:id` responses.

## 2. Reviews Service
- The `Review` entity is defined in `backend_doc.md` but missing in `API_TECHNICAL_DOC.md`. We need:
  - `GET /courses/:id/reviews`: List reviews for a course.
  - `POST /courses/:id/reviews`: Student submits a review.

## 3. Categories
- Frontend uses categories for filtering. We need an endpoint to fetch all available categories to populate dropdowns dynamically:
  - `GET /categories`

## 4. Certificates
- Documentation in `backend_doc.md` mentions a certificates endpoint. Please define:
  - `GET /enrollments/:courseId/certificate`: Returns the certificate data/URL if progress is 100%.

## 5. User Roles & Permissions
- Clarify if the `role` returned in `/auth/sync` and `/auth/me` is strictly Uppercase (`STUDENT`, `INSTRUCTOR`, `ADMIN`) or matches the existing frontend lowercase types (`student`, `instructor`, `admin`).

## 6. Type Alignments
- **Course Level**: Frontend uses "Beginner", "Intermediate", "Advanced", "All Levels". API specifies `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `ALL_LEVELS`. We need to decide on a standard (Uppercase preferred for Backend/DB, but Frontend needs a mapping if changed).
- **Price**: Ensure local currency support (KH) if needed, though currently defaulting to USD.
