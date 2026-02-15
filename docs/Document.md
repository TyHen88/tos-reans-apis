# Backend Architecture & Resources Documentation

This document outlines the backend architecture for the Tos Rean e-learning platform. The application will use a **Separated Frontend-Backend Architecture**.
- **Frontend**: Next.js (Admin Dashboard, Student Portal) consumes the API.
- **Backend**: Node.js + Express.js (REST API) handles logic, database, and payments.

---

## 1. Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod (for request body validation)
- **File Storage**: AWS S3 / Cloudflare R2 / Multer (Local/Cloud)
- **Payments**: ABA PayWay Integration

---

## 2. Entities (Database Schema)

We will use Prisma Schema to define our database models. These will mirror the entities required for the platform, ensuring compatibility with the frontend.

### User
Represents all system users (Students, Instructors, Admins).
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          Role      @default(STUDENT)
  avatar        String?
  bio           String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  courses       Course[]      @relation("InstructorCourses")
  enrollments   Enrollment[]
  reviews       Review[]
  transactions  Transaction[]
}

enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}
```

### Course
The core content unit. Matches the frontend `Course` interface.
```prisma
model Course {
  id            String    @id @default(uuid())
  title         String
  description   String    @db.Text
  thumbnail     String?
  videoUrl      String?   // Promo video
  price         Decimal   @db.Decimal(10, 2)
  level         Level     // BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS
  category      String
  tags          String[]
  duration      String?   // Display string e.g., "10h 30m" (Calculated on backend or stored)
  status        Status    @default(DRAFT)
  
  instructorId  String
  instructor    User      @relation("InstructorCourses", fields: [instructorId], references: [id])
  instructorName String? // Cached name for easier frontend display (Optional optimization)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  lessons       Lesson[]
  enrollments   Enrollment[]
  reviews       Review[]
  transactions  Transaction[]
  
  // Computed fields (Prisma doesn't store these, but API returns them)
  // lessonsCount: Int
  // studentsCount: Int
  // rating: Float
}

enum Level {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  ALL_LEVELS
}

enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### Lesson
Individual chapters or videos within a course. Matches frontend `Lesson` interface.
```prisma
model Lesson {
  id          String   @id @default(uuid())
  title       String
  description String?
  videoUrl    String?
  content     String?  // Markdown/Text content
  duration    Int      // Duration in minutes
  order       Int      // Sequence number
  isFree      Boolean  @default(false) // Previewable?
  attachments Json?    // Array of {name, url} objects

  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Enrollment
Tracks a user's purchase and progress in a course.
```prisma
model Enrollment {
  id               String   @id @default(uuid())
  progress         Int      @default(0) // 0-100%
  completedLessons String[] // Array of Lesson IDs

  userId           String
  user             User     @relation(fields: [userId], references: [id])
  
  courseId         String
  course           Course   @relation(fields: [courseId], references: [id])

  enrolledAt       DateTime @default(now())
  lastAccessedAt   DateTime @default(now())

  @@unique([userId, courseId])
}
```

### Review
Course reviews by students.
```prisma
model Review {
  id        String   @id @default(uuid())
  rating    Int      // 1-5
  comment   String?
  
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id])
  
  createdAt DateTime @default(now())
}
```

### Transaction (Payment)
Records financial transactions (e.g., PayWay).
```prisma
model Transaction {
  id              String   @id @default(uuid())
  amount          Decimal
  currency        String   @default("USD")
  status          TxStatus // PENDING, SUCCESS, FAILED
  provider        String   // "payway"
  externalId      String?  // ABA Transaction ID
  paymentUrl      String?  // for redirect

  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  courseId        String
  course          Course   @relation(fields: [courseId], references: [id])

  createdAt       DateTime @default(now())
}

enum TxStatus {
  PENDING
  SUCCESS
  FAILED
}
```

---

## 3. API Request and Response Standards

The backend will expose a REST API. All responses will follow a strict JSON structure.

### Standard Response Interface
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}
```

### API Endpoints & Payloads

#### Auth Routes (`/api/auth`)
- `POST /register`: Create a new user.
  - **Request**: `{ email, password, name, role? }`
  - **Response**: `{ user: User, token: string }`
- `POST /login`: Authenticate and return JWT.
  - **Request**: `{ email, password }`
  - **Response**: `{ user: User, token: string }`
- `GET /me`: Get current user profile (Protected).

#### Course Routes (`/api/courses`)
- `GET /`: List all published courses.
  - **Response**: `{ courses: Course[] }` (Includes calculated fields: `lessonsCount`, `studentsCount`, `rating`)
- `GET /:id`: Get course details with lessons.
  - **Response**: `{ course: Course & { lessons: Lesson[] } }`
- `POST /`: Create a new course.
  - **Request**: 
    ```json
    {
      "title": "Course Title",
      "description": "Course Desc",
      "price": 49.99,
      "category": "Dev",
      "level": "Beginner",
      "tags": ["React"],
      "thumbnail": "url",
      "videoUrl": "url"
    }
    ```
- `PUT /:id`: Update course details.
- `DELETE /:id`: Delete/Archive a course.

#### Lesson Routes (`/api/courses/:courseId/lessons`)
- `POST /`: Add a lesson.
  - **Request**: 
    ```json
    {
      "title": "Intro",
      "description": "...",
      "duration": 15,
      "isFree": true,
      "videoUrl": "..."
    }
    ```
- `PUT /:lessonId`: Update lesson.
- `DELETE /:lessonId`: Remove lesson.

#### Enrollment & Payment (`/api/enrollments`)
- `POST /checkout`: Initiate ABA PayWay transaction.
  - **Request**: `{ courseId: string }`
  - **Response**: `{ paymentUrl: string, transactionId: string }` (or QR data)
- `POST /webhook/payway`: Handle ABA callback.

---

## 4. Frontend-Backend Data Mapping

### User Interface Mapping
| Frontend Interface (`User`) | Backend DB (`User`) | Notes |
|-----------------------------|---------------------|-------|
| `id` | `id` | UUID |
| `name` | `name` | |
| `email` | `email` | |
| `role` | `role` | Mapped ENUM |
| `avatar` | `avatar` | |
| `bio` | `bio` | |
| `createdAt` | `createdAt` | |

### Course Interface Mapping
| Frontend Interface (`Course`) | Backend DB (`Course`) | Notes |
|-------------------------------|-----------------------|-------|
| `id` | `id` | UUID |
| `title` | `title` | |
| `description` | `description` | |
| `thumbnail` | `thumbnail` | |
| `videoUrl` | `videoUrl` | |
| `instructorId` | `instructorId` | Relations |
| `instructorName` | `instructor.name` | Joined query |
| `price` | `price` | Decimal -> Number |
| `level` | `level` | Enum match |
| `category` | `category` | |
| `tags` | `tags` | String array |
| `duration` | `duration` | Stored/Calc |
| `lessonsCount` | `_count.lessons` | Aggregation |
| `studentsCount` | `_count.enrollments` | Aggregation |
| `rating` | `reviews` (avg) | Aggregation |
| `status` | `status` | Enum match |

### Lesson Interface Mapping
| Frontend Interface (`Lesson`) | Backend DB (`Lesson`) | Notes |
|-------------------------------|-----------------------|-------|
| `id` | `id` | UUID |
| `courseId` | `courseId` | |
| `title` | `title` | |
| `description` | `description` | |
| `videoUrl` | `videoUrl` | |
| `duration` | `duration` | Int (min) |
| `order` | `order` | Int |
| `isFree` | `isFree` | Boolean |
| `attachments` | `attachments` | JSONB -> Obj |

---

## 5. Implementation Roadmap

1.  **Initialize Project**
    - `npm init -y`
    - Install `express`, `prisma`, `cors`, `dotenv`, `jsonwebtoken`, `bcrypt`, `zod`.
    - Setup TypeScript (`tsc --init`).

2.  **Database Setup**
    - Create `prisma/schema.prisma` with the models above.
    - Run `npx prisma migrate dev --name init`.

3.  **Auth System**
    - Implement `auth.routes.ts` and `auth.controller.ts`.
    - Create JWT middleware.

4.  **Core Features**
    - CRUD for Courses and Lessons ensuring response matches frontend Interfaces.
    - Implement aggregations (count of lessons, students) in `GET` requests.

5.  **Payment Gateway**
    - Implement ABA PayWay hash generation utility.
    - Implement Webhook listener.


Authentication Flow:
- Third party authentication (Google) using firebase.
DATABASE_URL="postgresql://mac_pg:12345678@localhost:5432/camnextgenhub_db?schema=public"
# DATABASE_URL="postgresql://postgres:decode@db8090@db.hryrukjiswydkpakmutd.supabase.co:5432/postgres"
# Firebase Admin SDK
FIREBASE_PROJECT_ID="cambonexthub"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@cambonexthub.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCKS1Xdw0WU2faO\n59/qYKQ1vDLTFhPEwmO9/EohrkOz7nic0RM9iwnecgbfHN3cOyPeGuuBm5mR8tro\nzTMHykLl15xaW2++1jFfY9fnXJnPpHR/uBCeIAkaAGFgilGSe0SLvFZ79YK5ybH2\n7VMOyQmqkP4g52AX0lokZwP3FIPZpWlbWJ98Z7g4uSMKGrDXZhv1XXIADbd9kTHY\nwCl9B9ivhiPSP6OFBaddlMtfu5s+CTmtjlynYzjHgCDYKs0SjA9qBKk/apII90C5\nj4KHybnJHmonK7UUu4AJ+NokoHl6tnS93LcstrShuNR4KXREV77z3Aom2rjNJgRP\nWE7VQaBvAgMBAAECggEADZR7QJURyp2isALGAqptxZcO+Jp043/hMoFJOEh3/n2+\n20tOk98I346b7SHVCXDHQ2KqWKZSbLoH1A9+YNf0PMSw5lCPRxKac48G3wHBWtn/\n1KDbBOQJcMOzzDqY6wTuxLgAWBjSNvM+5gwE+XE1YUnuooWF8qDl2ChDg+pATkli\ndcydysCdPtTAx/ZbzC6zPDBH7EeFdlGkKLDtv5aH69u2eVwXofYItfT3Eplc480S\nAUFq1KPKzw+ZirjiUNEFNgAOwenwJWzYxPbMS0ClJF0iwn+A/OyXXuWOiSiV+5GF\ngQuOgiId8IHSuEofJsLIuzg08vA7cM1q3Tc2xEqi9QKBgQDDajrySHi57eTM9yih\nv//tmUK4RANSC+vIDHm2GZ1hWILHa481QhkCAdz2LyEyvlMkqqOjXLMdAssqZxbD\n6GHKDy6x+pFihGJ4jiTbn9lkCtIJ8rdQnza+RVKx7aZm8Hgmqgqk0nkreCu50sN+\nQjHML7aRY9ZaYtuzhyzRA1mcOwKBgQC1K4di9b4GaNK4f9sYjqhgkNTPEuGSswT2\n0ol2Ieh3hfeh+OpZiMUyp6ZeU5yOhXsY1k60rNGVt8Mo6K2F3W/xf8e28mXc5tEK\nNfmwMUZDNLDGIlg1lPsbzydX3KITK5uvIuoYpmSYoayj3Ee7I76U/Hn00+qEXQJ3\nqTLU22CtXQKBgBo+0D/uH9jI7KviniBrSxI8PUvGRrPkSfyKQGaGti521sm11nwO\nrpEocubVmZ3ZFg2cpXGxZ5UD5QmC4vnY4hljRKA+yPv0T81lOeoNZAMduOwBH0HC\nwHV5lguzoV+9+EUpHVjZs9B0yVqhxgPVHB8SYXDRed6V3HAWPZys2II1AoGASVhK\nA0JBoA6n4JHCfXqjqBR6Uyrtr5pSFCrAA9dOabUOv8Ap//1i+FLvA5kN9JUNdMyu\nKG8emmI+3Dz2ow821qpIjEQuAPRhBKU9ZJtOOr8GIfCdjXO3BVckMmncI66v5INa\nCoiyiShK4Du5voWGDoL4TKnOc6/D4/XX4ly+EvECgYAiknY7YJ/BL+tzb/+LKY7y\n1Xpc5BneCW6tHr0Dvx3Qw5Anu9TZLmM9il70fd4yf/fY9j1oz2KZJdoxCsujNqWb\ngIxepKEvtkDRfhK0zMjm1yq28BZsaOgRM3i1tkucSNRD8h7zQwXmz9oWC4ylnQtn\nC5l7TRyjc7lkRP2cSMx0vw==\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyBZdkzC7_Un0rHLa-b2dvoEWL3nuGasc9E"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="cambonexthub.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="cambonexthub"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="cambonexthub.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="855492999328"
NEXT_PUBLIC_FIREBASE_APP_ID="1:855492999328:web:761f22df590dbd0db2b1c5"

- JWT authentication (using JWT or suggest for me)
