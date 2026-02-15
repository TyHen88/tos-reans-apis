# Profile Settings API - Implementation Guide

This guide provides step-by-step implementation instructions with complete code examples.

---

## Step 1: Update Database Schema

### 1.1 Add Session Model to Prisma Schema

Add this to your `prisma/schema.prisma` file after the User model:

```prisma
model Session {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Device Information
  deviceName  String
  deviceType  String   // "desktop" | "mobile" | "tablet"
  browser     String
  os          String?
  
  // Location & Security
  location    String?
  ipAddress   String
  
  // Token Management
  tokenHash   String   @unique
  expiresAt   DateTime
  
  // Timestamps
  createdAt   DateTime @default(now())
  lastActive  DateTime @default(now())
  revokedAt   DateTime?
  
  @@index([userId])
  @@index([userId, expiresAt])
  @@index([tokenHash])
  @@index([lastActive])
}
```

### 1.2 Update User Model

Add the sessions relation to your User model:

```prisma
model User {
  // ... existing fields ...
  
  sessions       Session[]  // Add this line
}
```

### 1.3 Run Migration

```bash
npx prisma migrate dev --name add_session_management
npx prisma generate
```

---

## Step 2: Install Dependencies

```bash
npm install ua-parser-js express-rate-limit
npm install --save-dev @types/ua-parser-js
```

---

## Step 3: Create Utility Classes

### 3.1 Device Detector

Create `src/utils/deviceDetector.ts`:

```typescript
import UAParser from 'ua-parser-js';

export class DeviceDetector {
  static parse(userAgent: string | undefined) {
    if (!userAgent) {
      return {
        deviceName: 'Unknown Device',
        deviceType: 'desktop',
        browser: 'Unknown Browser',
        os: 'Unknown OS'
      };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    return {
      deviceName: this.getDeviceName(result),
      deviceType: this.getDeviceType(result),
      browser: this.getBrowserInfo(result),
      os: this.getOSInfo(result)
    };
  }
  
  private static getDeviceName(result: UAParser.IResult): string {
    if (result.device.model) {
      return result.device.model;
    }
    if (result.os.name === 'Mac OS') return 'MacBook';
    if (result.os.name === 'Windows') return 'Windows PC';
    if (result.os.name === 'iOS') return result.device.model || 'iPhone';
    if (result.os.name === 'Android') return result.device.vendor || 'Android Device';
    return 'Unknown Device';
  }
  
  private static getDeviceType(result: UAParser.IResult): string {
    if (result.device.type === 'mobile') return 'mobile';
    if (result.device.type === 'tablet') return 'tablet';
    return 'desktop';
  }
  
  private static getBrowserInfo(result: UAParser.IResult): string {
    const name = result.browser.name || 'Unknown';
    const version = result.browser.version || '';
    return version ? `${name} ${version}` : name;
  }
  
  private static getOSInfo(result: UAParser.IResult): string {
    const name = result.os.name || 'Unknown';
    const version = result.os.version || '';
    return version ? `${name} ${version}` : name;
  }
}
```

### 3.2 Password Validator

Create `src/utils/passwordValidator.ts`:

```typescript
import bcrypt from 'bcrypt';

export class PasswordValidator {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly COMMON_PASSWORDS = [
    'password', '12345678', 'qwerty', 'admin123', 'letmein',
    'welcome', 'monkey', '1234567890', 'password123'
  ];
  
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
      return { valid: false, errors };
    }
    
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }
    
    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must not exceed ${this.MAX_LENGTH} characters`);
    }
    
    if (/^[0-9]+$/.test(password)) {
      errors.push('Password cannot contain only numbers');
    }
    
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a stronger password');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  static async isSameAsOld(newPassword: string, oldHash: string): Promise<boolean> {
    return await bcrypt.compare(newPassword, oldHash);
  }
  
  private static isCommonPassword(password: string): boolean {
    return this.COMMON_PASSWORDS.includes(password.toLowerCase());
  }
}
```

### 3.3 IP Utilities

Create `src/utils/ipUtils.ts`:

```typescript
import { Request } from 'express';
import logger from './logger';

export class IPUtils {
  static getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }
  
  static async getLocation(ip: string): Promise<string | null> {
    // Skip for localhost/private IPs
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip === '::1') {
      return 'Local Network';
    }
    
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      if (data.city && data.country_name) {
        return `${data.city}, ${data.country_name}`;
      }
      
      return data.country_name || null;
    } catch (error) {
      logger.warn('Geolocation failed:', error);
      return null;
    }
  }
}
```

---

## Step 4: Create Services

### 4.1 Session Service

Create `src/services/session.service.ts`:

```typescript
import { Request } from 'express';
import { prisma } from '../utils/prisma';
import { DeviceDetector } from '../utils/deviceDetector';
import { IPUtils } from '../utils/ipUtils';
import { AppError } from '../utils/AppError';
import crypto from 'crypto';

export class SessionService {
  async createSession(userId: string, req: Request, token: string) {
    const deviceInfo = DeviceDetector.parse(req.headers['user-agent']);
    const ipAddress = IPUtils.getClientIP(req);
    const location = await IPUtils.getLocation(ipAddress);
    const tokenHash = this.hashToken(token);
    
    return await prisma.session.create({
      data: {
        userId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress,
        location,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    });
  }
  
  async getActiveSessions(userId: string) {
    return await prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gte: new Date() }
      },
      orderBy: {
        lastActive: 'desc'
      }
    });
  }
  
  async updateLastActive(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActive: new Date() }
    }).catch(() => {
      // Silently fail - session might be expired
    });
  }
  
  async revokeSession(sessionId: string, userId: string, currentSessionId: string): Promise<void> {
    if (sessionId === currentSessionId) {
      throw new AppError('Cannot revoke current session. Please use logout instead.', 400, 'SESSION_003');
    }
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new AppError('Session not found', 404, 'SESSION_001');
    }
    
    if (session.userId !== userId) {
      throw new AppError('Unauthorized to revoke this session', 403, 'SESSION_002');
    }
    
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });
  }
  
  async validateSession(sessionId: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) return false;
    if (session.revokedAt) return false;
    if (session.expiresAt < new Date()) return false;
    
    return true;
  }
  
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const sessionService = new SessionService();
```

### 4.2 Security Score Service

Create `src/services/securityScore.service.ts`:

```typescript
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';

interface SecurityScore {
  score: number;
  level: 'Excellent' | 'Good' | 'Needs Attention';
  factors: {
    hasPassword: boolean;
    hasGoogleAuth: boolean;
    sessionCount: number;
    emailVerified: boolean;
  };
}

export class SecurityScoreService {
  async calculateScore(userId: string): Promise<SecurityScore> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          where: {
            revokedAt: null,
            expiresAt: { gte: new Date() }
          }
        }
      }
    });
    
    if (!user) {
      throw new AppError('User not found', 404, 'USER_001');
    }
    
    let score = 40; // Base score
    
    const factors = {
      hasPassword: !!user.passwordHash,
      hasGoogleAuth: !!user.firebaseUid,
      sessionCount: user.sessions.length,
      emailVerified: user.isEmailVerified
    };
    
    // Scoring logic as per spec
    if (factors.hasPassword) score += 20;
    if (factors.hasGoogleAuth) score += 15;
    if (factors.sessionCount <= 3) score += 15;
    if (factors.emailVerified) score += 10;
    
    const level = score >= 80 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Attention';
    
    return { score, level, factors };
  }
}

export const securityScoreService = new SecurityScoreService();
```

---

## Step 5: Create Controllers

### 5.1 User Controller

Create `src/controllers/user.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { PasswordValidator } from '../utils/passwordValidator';
import { sessionService } from '../services/session.service';
import { securityScoreService } from '../services/securityScore.service';
import bcrypt from 'bcrypt';

// GET /api/user/profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firebaseUid: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: true, // We'll transform this
      }
    });
    
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_001'));
    }
    
    // Transform response
    const { passwordHash, ...userWithoutHash } = user;
    const response = {
      ...userWithoutHash,
      hasPassword: !!passwordHash
    };
    
    return ApiResponse.success(res, response);
  } catch (error) {
    return next(error);
  }
};

// PUT /api/user/profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { name, email } = req.body;
    
    // Validation
    if (!name || name.length < 2 || name.length > 100) {
      return next(new AppError('Name must be between 2 and 100 characters', 400, 'VALIDATION_001'));
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new AppError('Valid email is required', 400, 'VALIDATION_002'));
    }
    
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== userId) {
      return next(new AppError('Email already in use', 409, 'USER_002'));
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });
    
    return ApiResponse.success(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    return next(error);
  }
};

// POST /api/user/password/add
export const addPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { newPassword, confirmPassword } = req.body;
    
    // Get user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_001'));
    }
    
    // Check if user already has a password
    if (user.passwordHash) {
      return next(new AppError('User already has a password. Use change password instead.', 400, 'PASSWORD_003'));
    }
    
    // Check if user has Google auth
    if (!user.firebaseUid) {
      return next(new AppError('This endpoint is for Google users only', 400, 'PASSWORD_004'));
    }
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400, 'PASSWORD_005'));
    }
    
    // Validate password strength
    const validation = PasswordValidator.validate(newPassword);
    if (!validation.valid) {
      return next(new AppError(validation.errors.join(', '), 400, 'PASSWORD_006'));
    }
    
    // Hash and save password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });
    
    return ApiResponse.success(res, { 
      message: 'Password added successfully',
      hasPassword: true 
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/user/password/change
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Get user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_001'));
    }
    
    // Check if user has a password
    if (!user.passwordHash) {
      return next(new AppError('No password set. Use add password endpoint instead.', 403, 'PASSWORD_001'));
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401, 'PASSWORD_002'));
    }
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return next(new AppError('New passwords do not match', 400, 'PASSWORD_005'));
    }
    
    // Check if new password is same as old
    const isSameAsOld = await PasswordValidator.isSameAsOld(newPassword, user.passwordHash);
    if (isSameAsOld) {
      return next(new AppError('New password must be different from current password', 400, 'PASSWORD_007'));
    }
    
    // Validate password strength
    const validation = PasswordValidator.validate(newPassword);
    if (!validation.valid) {
      return next(new AppError(validation.errors.join(', '), 400, 'PASSWORD_006'));
    }
    
    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });
    
    return ApiResponse.success(res, { message: 'Password changed successfully' });
  } catch (error) {
    return next(error);
  }
};

// GET /api/user/sessions
export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const currentSessionId = (req as any).user.sessionId;
    
    const sessions = await sessionService.getActiveSessions(userId);
    
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      browser: session.browser,
      location: session.location,
      ipAddress: session.ipAddress,
      lastActive: session.lastActive,
      isCurrent: session.id === currentSessionId,
      createdAt: session.createdAt
    }));
    
    return ApiResponse.success(res, { sessions: formattedSessions });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/user/sessions/:sessionId
export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const currentSessionId = (req as any).user.sessionId;
    const { sessionId } = req.params;
    
    await sessionService.revokeSession(sessionId, userId, currentSessionId);
    
    return ApiResponse.success(res, { message: 'Session revoked successfully' });
  } catch (error) {
    return next(error);
  }
};

// GET /api/user/security-score
export const getSecurityScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const score = await securityScoreService.calculateScore(userId);
    
    return ApiResponse.success(res, score);
  } catch (error) {
    return next(error);
  }
};
```

---

## Step 6: Create Routes

Create `src/routes/user.routes.ts`:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  addPassword,
  changePassword,
  getSessions,
  revokeSession,
  getSecurityScore
} from '../controllers/user.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiters
const passwordChangeLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many password change attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const profileUpdateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many profile update attempts. Please try again later.',
});

const sessionRevokeLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many session revoke attempts. Please try again later.',
});

// All routes require authentication
router.use(authMiddleware);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', profileUpdateLimit, updateProfile);

// Password routes
router.post('/password/add', passwordChangeLimit, addPassword);
router.put('/password/change', passwordChangeLimit, changePassword);

// Session routes
router.get('/sessions', getSessions);
router.delete('/sessions/:sessionId', sessionRevokeLimit, revokeSession);

// Security score
router.get('/security-score', getSecurityScore);

export default router;
```

---

## Step 7: Update Main Routes

Update `src/routes/index.ts`:

```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import courseRoutes from './course.routes';
import enrollmentRoutes from './enrollment.routes';
import adminRoutes from './admin.routes';
import resourceRoutes from './resource.routes';
import uploadRoutes from './upload.routes';
import categoryRoutes from './category.routes';
import wishlistRoutes from './wishlist.routes';
import progressRoutes from './progress.routes';
import userRoutes from './user.routes'; // Add this

const router = Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/admin', adminRoutes);
router.use('/resources', resourceRoutes);
router.use('/upload', uploadRoutes);
router.use('/categories', categoryRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/progress', progressRoutes);
router.use('/user', userRoutes); // Add this

export default router;
```

---

## Step 8: Update Auth Controller for Sessions

Update `src/controllers/auth.controller.ts` to create sessions on login:

```typescript
// Add import
import { sessionService } from '../services/session.service';

// Update the register function
export const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('User already exists', 400, 'AUTH_006'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        role: role || 'STUDENT',
      },
      select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    // Create session
    const tempToken = 'temp'; // We'll update this
    const session = await sessionService.createSession(user.id, req, tempToken);

    // Create token with sessionId
    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId: session.id,
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );

    // Update session with actual token hash
    await prisma.session.update({
      where: { id: session.id },
      data: { 
        tokenHash: require('crypto').createHash('sha256').update(token).digest('hex')
      }
    });

    return ApiResponse.success(res, { user, token }, 'User created successfully', 201);
  } catch (error) {
    return next(error);
  }
};

// Update the login function similarly
export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError('Invalid credentials', 400, 'AUTH_005'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 400, 'AUTH_005'));
    }

    // Create session
    const tempToken = 'temp';
    const session = await sessionService.createSession(user.id, req, tempToken);

    // Create token with sessionId
    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId: session.id,
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );

    // Update session with actual token hash
    await prisma.session.update({
      where: { id: session.id },
      data: { 
        tokenHash: require('crypto').createHash('sha256').update(token).digest('hex')
      }
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return ApiResponse.success(res, { user: userWithoutPassword, token }, 'Logged in successfully');
  } catch (error) {
    return next(error);
  }
};
```

---

## Step 9: Update Auth Middleware

Update `src/middleware/auth.middleware.ts` to validate sessions:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { sessionService } from '../services/session.service';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new AppError('Authentication required', 401, 'AUTH_001'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Validate session if sessionId exists
    if (decoded.sessionId) {
      const isValid = await sessionService.validateSession(decoded.sessionId);
      if (!isValid) {
        return next(new AppError('Session expired or revoked', 401, 'AUTH_007'));
      }
      
      // Update last active (async, don't await)
      sessionService.updateLastActive(decoded.sessionId).catch(() => {});
    }
    
    (req as any).user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid token', 401, 'AUTH_002'));
  }
};
```

---

## Step 10: Testing

Create test file `test-profile-api.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3300/api"

echo "=== Testing Profile Settings API ==="

# 1. Register a new user
echo -e "\n1. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testprofile@example.com",
    "password": "SecurePass123",
    "name": "Test User"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')
echo "Token: $TOKEN"

# 2. Get profile
echo -e "\n2. Getting user profile..."
curl -s -X GET "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 3. Update profile
echo -e "\n3. Updating profile..."
curl -s -X PUT "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "testprofile@example.com"
  }' | jq .

# 4. Change password
echo -e "\n4. Changing password..."
curl -s -X PUT "$API_URL/user/password/change" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass456",
    "confirmPassword": "NewSecurePass456"
  }' | jq .

# 5. Get sessions
echo -e "\n5. Getting active sessions..."
curl -s -X GET "$API_URL/user/sessions" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 6. Get security score
echo -e "\n6. Getting security score..."
curl -s -X GET "$API_URL/user/security-score" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n=== Testing Complete ==="
```

Make it executable:
```bash
chmod +x test-profile-api.sh
./test-profile-api.sh
```

---

## Deployment Checklist

- [ ] Run migrations on production database
- [ ] Update environment variables
- [ ] Test all endpoints
- [ ] Update API documentation
- [ ] Monitor error logs
- [ ] Set up session cleanup cron job

---

## Next Steps

1. Implement the code above
2. Run tests
3. Update Swagger documentation
4. Coordinate with frontend team for integration testing
5. Deploy to staging environment

**Questions?** Refer to the main analysis document for detailed explanations.
