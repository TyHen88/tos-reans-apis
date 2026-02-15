# Profile Settings API - Quick Reference

## 📋 Summary

Your Profile Settings API specification is **excellent** and ready for implementation. Here's what you need to know:

---

## ✅ Current State

**You already have 80% of what you need:**
- ✅ User model with `passwordHash`, `firebaseUid`, `isEmailVerified`
- ✅ JWT authentication working
- ✅ Bcrypt password hashing
- ✅ Error handling infrastructure
- ✅ API response standards

**What's missing:**
- ❌ Session model & management
- ❌ 7 new user profile endpoints
- ❌ Device detection utilities
- ❌ Session tracking middleware

---

## 🎯 Implementation Effort

**Estimated Time:** 4-5 days (matches your spec)

**Breakdown:**
- Day 1-2: Database schema + utilities
- Day 2-3: Profile & password endpoints
- Day 3-4: Session management
- Day 4-5: Security features + testing

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install ua-parser-js express-rate-limit
npm install --save-dev @types/ua-parser-js
```

### 2. Update Database Schema
Add to `prisma/schema.prisma`:
```prisma
model Session {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  deviceName  String
  deviceType  String
  browser     String
  os          String?
  location    String?
  ipAddress   String
  tokenHash   String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  lastActive  DateTime @default(now())
  revokedAt   DateTime?
  
  @@index([userId])
  @@index([userId, expiresAt])
  @@index([tokenHash])
}

model User {
  // ... existing fields ...
  sessions Session[]  // Add this relation
}
```

Run migration:
```bash
npx prisma migrate dev --name add_session_management
```

### 3. Create Files

**Utilities:**
- `src/utils/deviceDetector.ts` - Parse user agents
- `src/utils/passwordValidator.ts` - Validate passwords
- `src/utils/ipUtils.ts` - IP & geolocation

**Services:**
- `src/services/session.service.ts` - Session CRUD
- `src/services/securityScore.service.ts` - Calculate scores

**Routes & Controllers:**
- `src/routes/user.routes.ts` - 7 new endpoints
- `src/controllers/user.controller.ts` - Business logic

### 4. Update Existing Files

**`src/controllers/auth.controller.ts`:**
- Add session creation on login/register
- Include `sessionId` in JWT payload

**`src/middleware/auth.middleware.ts`:**
- Validate session on each request
- Update `lastActive` timestamp

**`src/routes/index.ts`:**
- Add `router.use('/user', userRoutes)`

---

## 📚 API Endpoints to Implement

| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|------------|
| GET | `/api/user/profile` | Get current user | - |
| PUT | `/api/user/profile` | Update profile | 10/hour |
| POST | `/api/user/password/add` | Add password (Google users) | 5/hour |
| PUT | `/api/user/password/change` | Change password | 5/hour |
| GET | `/api/user/sessions` | List active sessions | - |
| DELETE | `/api/user/sessions/:id` | Revoke session | 20/hour |
| GET | `/api/user/security-score` | Get security score | - |

---

## 🔐 Security Best Practices

### ✅ DO's
1. **Hash passwords** with bcrypt (10+ rounds) ✅ Already doing this
2. **Validate input** - Check email format, password strength
3. **Rate limit** - Prevent brute force attacks
4. **Session expiration** - Auto-cleanup after 30 days
5. **Audit logging** - Log security events
6. **HTTPS only** - Never send tokens over HTTP

### ❌ DON'Ts
1. **Don't return password hashes** in API responses
2. **Don't allow current session revocation** (use logout)
3. **Don't skip session validation** on protected routes
4. **Don't store plain IPs** without considering GDPR
5. **Don't make geolocation blocking** - Use async with fallback

---

## 🎨 Code Patterns

### Password Validation
```typescript
const validation = PasswordValidator.validate(password);
if (!validation.valid) {
  throw new AppError(validation.errors.join(', '), 400, 'PASSWORD_006');
}
```

### Session Creation
```typescript
const session = await sessionService.createSession(userId, req, token);
const token = jwt.sign({ 
  userId, 
  sessionId: session.id,
  role: user.role 
}, secret, { expiresIn: '7d' });
```

### Session Validation
```typescript
const isValid = await sessionService.validateSession(sessionId);
if (!isValid) {
  throw new AppError('Session expired or revoked', 401, 'AUTH_007');
}
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: JWT Cannot Be Truly Revoked
**Solution:** Validate session on every request
```typescript
// In authMiddleware
const session = await prisma.session.findUnique({
  where: { id: decoded.sessionId }
});
if (session?.revokedAt) {
  throw new AppError('Session revoked', 401);
}
```

### Issue 2: Geolocation API Costs
**Solution:** Use free tier (ipapi.co - 1000/day) with graceful fallback
```typescript
try {
  const location = await IPUtils.getLocation(ip);
} catch (error) {
  location = null; // Graceful degradation
}
```

### Issue 3: Session Cleanup
**Solution:** Scheduled job to delete expired sessions
```typescript
// Run daily via cron
await prisma.session.deleteMany({
  where: {
    OR: [
      { expiresAt: { lt: new Date() } },
      { revokedAt: { not: null, lt: thirtyDaysAgo } }
    ]
  }
});
```

---

## 🧪 Testing Strategy

### Unit Tests
- Password validation logic
- Security score calculation
- Device detection parsing

### Integration Tests
- All 7 endpoints
- Google user flow (add password)
- Regular user flow (change password)
- Session revocation

### Test Script
```bash
# See PROFILE_SETTINGS_IMPLEMENTATION_GUIDE.md
./test-profile-api.sh
```

---

## 📊 Database Impact

**New Table:** `Session`
- Expected rows: ~3-5 per active user
- Growth rate: Moderate
- Cleanup: Automated (30-day expiration)

**Modified Table:** `User`
- New relation: `sessions Session[]`
- No schema changes needed (already has required fields)

---

## 🔄 Migration Path

### Development
```bash
npx prisma migrate dev --name add_session_management
npx prisma generate
```

### Production
```bash
# Backup database first!
npx prisma migrate deploy
```

---

## 📖 Documentation

### For Frontend Team
- All endpoints follow existing `apiClient` pattern
- JWT token in `Authorization: Bearer <token>` header
- Standard error response format maintained
- See `PROFILE_SETTINGS_API_SPEC.md` for complete API docs

### For Backend Team
- See `PROFILE_SETTINGS_ANALYSIS.md` for detailed analysis
- See `PROFILE_SETTINGS_IMPLEMENTATION_GUIDE.md` for code examples
- All code follows existing patterns in `auth.controller.ts`

---

## ✅ Implementation Checklist

### Phase 1: Foundation
- [ ] Install dependencies (`ua-parser-js`, `express-rate-limit`)
- [ ] Add Session model to schema
- [ ] Run migration
- [ ] Create utility classes (DeviceDetector, PasswordValidator, IPUtils)
- [ ] Create services (SessionService, SecurityScoreService)

### Phase 2: Endpoints
- [ ] Create `user.routes.ts` and `user.controller.ts`
- [ ] Implement GET `/api/user/profile`
- [ ] Implement PUT `/api/user/profile`
- [ ] Implement POST `/api/user/password/add`
- [ ] Implement PUT `/api/user/password/change`
- [ ] Add rate limiting middleware

### Phase 3: Sessions
- [ ] Update `auth.controller.ts` to create sessions
- [ ] Update JWT payload to include `sessionId`
- [ ] Implement GET `/api/user/sessions`
- [ ] Implement DELETE `/api/user/sessions/:id`
- [ ] Update `auth.middleware.ts` to validate sessions

### Phase 4: Security
- [ ] Implement GET `/api/user/security-score`
- [ ] Add session tracking middleware
- [ ] Create session cleanup job
- [ ] Write unit tests
- [ ] Write integration tests

### Phase 5: Deployment
- [ ] Update Swagger documentation
- [ ] Test with frontend
- [ ] Deploy to staging
- [ ] Monitor logs
- [ ] Deploy to production

---

## 🎯 Success Criteria

✅ All 7 endpoints working
✅ Sessions created on login
✅ Sessions validated on requests
✅ Rate limiting active
✅ Tests passing (>80% coverage)
✅ Frontend integration successful
✅ No security vulnerabilities
✅ Performance acceptable (<200ms response time)

---

## 📞 Support

**Questions?** Check these documents:
1. `PROFILE_SETTINGS_API_SPEC.md` - API specification
2. `PROFILE_SETTINGS_ANALYSIS.md` - Detailed analysis & best practices
3. `PROFILE_SETTINGS_IMPLEMENTATION_GUIDE.md` - Step-by-step code examples

**Ready to start?** Begin with Phase 1 of the implementation checklist!

---

**Estimated Completion:** 4-5 days  
**Risk Level:** Low  
**Recommendation:** ✅ Proceed with implementation
