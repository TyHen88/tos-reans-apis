# Profile Settings API Specification

**Document Version:** 1.0  
**Last Updated:** 2026-02-15  
**Status:** Ready for Backend Implementation

---

## Overview

This document specifies the backend API requirements for the **Profile Settings** feature. The frontend implementation is complete and currently uses `localStorage` for data persistence. This spec defines the APIs needed to replace mock data with real backend integration.

---

## Table of Contents

1. [User Profile Management](#1-user-profile-management)
2. [Password Management](#2-password-management)
3. [Session Management (Device Tracking)](#3-session-management-device-tracking)
4. [Security Score Calculation](#4-security-score-calculation)
5. [Database Schema Updates](#5-database-schema-updates)
6. [Error Handling](#6-error-handling)
7. [Frontend Integration Notes](#7-frontend-integration-notes)

---

## 1. User Profile Management

### 1.1 Get Current User Profile

**Endpoint:** `GET /api/user/profile`

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "STUDENT" | "INSTRUCTOR" | "ADMIN",
  "firebaseUid": "string | null",
  "hasPassword": "boolean",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp"
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

---

### 1.2 Update User Profile

**Endpoint:** `PUT /api/user/profile`

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "name": "string",
  "email": "string"
}
```

**Validation Rules:**
- `name`: Required, min 2 characters, max 100 characters
- `email`: Required, valid email format, unique in database

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "STUDENT" | "INSTRUCTOR" | "ADMIN",
  "updatedAt": "ISO8601 timestamp"
}
```

**Status Codes:**
- `200 OK` - Profile updated successfully
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid token
- `409 Conflict` - Email already exists

**Error Response Example:**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Email already in use"
  }
}
```

---

## 2. Password Management

### 2.1 Add Password (Google Users)

**Endpoint:** `POST /api/user/password/add`

**Authentication:** Required (JWT token)

**Use Case:** Google-authenticated users adding a backup password

**Request Body:**
```json
{
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Validation Rules:**
- User must NOT already have a password (check `passwordHash` is null)
- User must have a `firebaseUid` (Google user)
- `newPassword`: Required, min 8 characters
- `newPassword` must match `confirmPassword`

**Response:**
```json
{
  "message": "Password added successfully",
  "hasPassword": true
}
```

**Status Codes:**
- `200 OK` - Password added
- `400 Bad Request` - Validation error or user already has password
- `401 Unauthorized` - Invalid token

---

### 2.2 Change Password

**Endpoint:** `PUT /api/user/password/change`

**Authentication:** Required (JWT token)

**Use Case:** Users with existing passwords updating their password

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Validation Rules:**
- User must have an existing password (check `passwordHash` is not null)
- `currentPassword` must match stored hash
- `newPassword`: Required, min 8 characters
- `newPassword` must match `confirmPassword`
- `newPassword` must be different from `currentPassword`

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

**Status Codes:**
- `200 OK` - Password changed
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid token or incorrect current password
- `403 Forbidden` - User doesn't have a password set

**Error Response Example:**
```json
{
  "error": "Invalid current password"
}
```

---

## 3. Session Management (Device Tracking)

### 3.1 Get Active Sessions

**Endpoint:** `GET /api/user/sessions`

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "sessions": [
    {
      "id": "string",
      "deviceName": "string",
      "deviceType": "desktop" | "mobile" | "tablet",
      "browser": "string",
      "location": "string",
      "ipAddress": "string",
      "lastActive": "ISO8601 timestamp",
      "isCurrent": "boolean",
      "createdAt": "ISO8601 timestamp"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid token

**Implementation Notes:**
- `isCurrent` should be `true` for the session making the request
- `deviceName` can be inferred from User-Agent (e.g., "MacBook Pro", "iPhone 15 Pro")
- `deviceType` should be detected from User-Agent
- `browser` should include name and version (e.g., "Chrome 122", "Safari iOS")
- `location` can be inferred from IP geolocation (e.g., "Phnom Penh, Cambodia")

---

### 3.2 Revoke Session

**Endpoint:** `DELETE /api/user/sessions/:sessionId`

**Authentication:** Required (JWT token)

**Path Parameters:**
- `sessionId`: UUID of the session to revoke

**Response:**
```json
{
  "message": "Session revoked successfully"
}
```

**Status Codes:**
- `200 OK` - Session revoked
- `400 Bad Request` - Cannot revoke current session
- `401 Unauthorized` - Invalid token
- `403 Forbidden` - Session doesn't belong to user
- `404 Not Found` - Session not found

**Business Rules:**
- Users cannot revoke their current session (must use logout)
- Revoking a session should invalidate the JWT token for that session

---

### 3.3 Session Tracking Middleware

**Implementation Required:**

Create middleware to track sessions on every authenticated request:

```typescript
// Pseudo-code
async function trackSession(req, res, next) {
  const userId = req.user.id
  const sessionId = req.sessionId // from JWT
  
  // Update lastActive timestamp
  await db.session.update({
    where: { id: sessionId },
    data: { lastActive: new Date() }
  })
  
  next()
}
```

**Session Creation (on login):**
- Capture User-Agent, IP address, device info
- Create session record in database
- Include `sessionId` in JWT payload

---

## 4. Security Score Calculation

### 4.1 Get Security Score

**Endpoint:** `GET /api/user/security-score`

**Authentication:** Required (JWT token)

**Response:**
```json
{
  "score": 85,
  "level": "Excellent" | "Good" | "Needs Attention",
  "factors": {
    "hasPassword": true,
    "hasGoogleAuth": true,
    "sessionCount": 2,
    "emailVerified": true
  }
}
```

**Calculation Logic:**
```
Base score: 40 points
+ Has password: +20 points
+ Has Google auth (firebaseUid): +15 points
+ Session count <= 3: +15 points
+ Email verified: +10 points
Max: 100 points
```

**Score Levels:**
- `< 50`: "Needs Attention"
- `50-79`: "Good"
- `80-100`: "Excellent"

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid token

---

## 5. Database Schema Updates

### 5.1 User Table Updates

Add the following fields to the `User` model:

```prisma
model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  role         UserRole  @default(STUDENT)
  passwordHash String?   // Nullable for Google-only users
  firebaseUid  String?   @unique // For Google Sign-In users
  emailVerified Boolean  @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  sessions     Session[]
}
```

---

### 5.2 Session Table (New)

Create a new `Session` model:

```prisma
model Session {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  deviceName  String
  deviceType  String   // "desktop" | "mobile" | "tablet"
  browser     String
  location    String?
  ipAddress   String
  
  createdAt   DateTime @default(now())
  lastActive  DateTime @default(now())
  
  @@index([userId])
  @@index([lastActive])
}
```

---

## 6. Error Handling

### Standard Error Response Format

All error responses should follow this structure:

```json
{
  "error": "string",
  "details": {
    "field": "error message"
  }
}
```

### Common Error Codes

| Status Code | Error Type | Example |
|-------------|------------|---------|
| `400` | Bad Request | Validation errors, malformed request |
| `401` | Unauthorized | Invalid/missing JWT token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Email already exists |
| `500` | Internal Server Error | Unexpected server error |

---

## 7. Frontend Integration Notes

### 7.1 Current Mock Implementation

The frontend currently uses `localStorage` for:
- User profile data: `tosrean_user`
- Users list: `tosrean_users`
- Mock device data (hardcoded)

### 7.2 API Client Setup

Frontend will use the existing `apiClient` from `lib/api/client.ts`:

```typescript
// Example usage
import { apiClient } from '@/lib/api/client'

// Get profile
const profile = await apiClient.get('/user/profile')

// Update profile
const updated = await apiClient.put('/user/profile', {
  name: 'New Name',
  email: 'new@email.com'
})

// Change password
await apiClient.put('/user/password/change', {
  currentPassword: 'old',
  newPassword: 'new',
  confirmPassword: 'new'
})

// Get sessions
const sessions = await apiClient.get('/user/sessions')

// Revoke session
await apiClient.delete(`/user/sessions/${sessionId}`)
```

### 7.3 Authentication Headers

All requests will include:
```
Authorization: Bearer <JWT_TOKEN>
```

Token is stored in `localStorage` as `tosrean_token`.

---

## 8. Implementation Checklist

### Backend Tasks

- [ ] **Database Schema**
  - [ ] Add `passwordHash` field to User model (nullable)
  - [ ] Add `firebaseUid` field to User model (nullable, unique)
  - [ ] Add `emailVerified` field to User model
  - [ ] Create `Session` model with all required fields
  - [ ] Run migrations

- [ ] **API Endpoints**
  - [ ] `GET /api/user/profile`
  - [ ] `PUT /api/user/profile`
  - [ ] `POST /api/user/password/add`
  - [ ] `PUT /api/user/password/change`
  - [ ] `GET /api/user/sessions`
  - [ ] `DELETE /api/user/sessions/:sessionId`
  - [ ] `GET /api/user/security-score`

- [ ] **Middleware**
  - [ ] Session tracking middleware
  - [ ] Device detection utility
  - [ ] IP geolocation service integration

- [ ] **Security**
  - [ ] Password hashing (bcrypt with salt rounds >= 10)
  - [ ] JWT session ID inclusion
  - [ ] Session invalidation on revoke
  - [ ] Rate limiting for password change attempts

- [ ] **Testing**
  - [ ] Unit tests for password validation
  - [ ] Integration tests for all endpoints
  - [ ] Test Google user flow (add password)
  - [ ] Test manual user flow (change password)
  - [ ] Test session management

---

## 9. Security Considerations

### Password Storage
- Use `bcrypt` with minimum 10 salt rounds
- Never store plain-text passwords
- Never return password hashes in API responses

### Session Security
- Include `sessionId` in JWT payload
- Implement session expiration (e.g., 30 days)
- Clean up expired sessions (cron job)
- Log all session revocations for audit

### Rate Limiting
- Password change: Max 5 attempts per hour
- Profile update: Max 10 attempts per hour
- Session revoke: Max 20 attempts per hour

---

## 10. Future Enhancements (Not in Scope)

These features are mentioned in the design docs but not required for initial implementation:

- Two-Factor Authentication (2FA)
- Passkey support
- Security activity logs
- Email notifications for security events
- Password reset flow

---

## Questions for Backend Team?

If you have any questions about this specification, please reach out. The frontend is ready and waiting for these APIs to be implemented.

**Frontend Contact:** [Your Name]  
**Estimated Backend Effort:** 3-5 days  
**Priority:** High
