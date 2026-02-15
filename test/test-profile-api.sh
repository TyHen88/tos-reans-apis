#!/bin/bash

# Configuration
API_URL="http://localhost:3301/api"
EMAIL="test-user-$(date +%s)@example.com"
PASSWORD="Password123!"
NEW_PASSWORD="NewPassword456!"

echo "🚀 Starting Profile Settings API Test..."

# 1. Register User
echo "1. Registering user..."
REGISTER_RES=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Test User\"}")

TOKEN=$(echo $REGISTER_RES | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
  echo $REGISTER_RES
  exit 1
fi
echo "✅ Registered successfully"

# 2. Get Profile
echo "2. Getting profile..."
PROFILE_RES=$(curl -s -X GET "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN")

if [[ $PROFILE_RES == *"success\":true"* ]]; then
  echo "✅ Profile retrieved"
else
  echo "❌ Profile retrieval failed"
  echo $PROFILE_RES
  exit 1
fi

# 3. Update Profile
echo "3. Updating profile..."
UPDATE_RES=$(curl -s -X PUT "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Updated Name\",\"email\":\"$EMAIL\"}")

if [[ $UPDATE_RES == *"Profile updated successfully"* ]]; then
  echo "✅ Profile updated"
else
  echo "❌ Profile update failed"
  echo $UPDATE_RES
  exit 1
fi

# 4. Get Security Score
echo "4. Getting security score..."
SCORE_RES=$(curl -s -X GET "$API_URL/user/security-score" \
  -H "Authorization: Bearer $TOKEN")

if [[ $SCORE_RES == *"score"* ]]; then
  echo "✅ Security score retrieved"
else
  echo "❌ Security score failed"
  echo $SCORE_RES
  exit 1
fi

# 5. List Sessions
echo "5. Listing sessions..."
SESSIONS_RES=$(curl -s -X GET "$API_URL/user/sessions" \
  -H "Authorization: Bearer $TOKEN")

SESSION_COUNT=$(echo $SESSIONS_RES | jq '.data.sessions | length')

if [ "$SESSION_COUNT" -gt 0 ]; then
  echo "✅ Sessions listed ($SESSION_COUNT sessions)"
else
  echo "❌ No sessions found"
  echo $SESSIONS_RES
  exit 1
fi

# 6. Change Password
echo "6. Changing password..."
CHANGE_RES=$(curl -s -X PUT "$API_URL/user/password/change" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\":\"$PASSWORD\",\"newPassword\":\"$NEW_PASSWORD\",\"confirmPassword\":\"$NEW_PASSWORD\"}")

if [[ $CHANGE_RES == *"Password changed successfully"* ]]; then
  echo "✅ Password changed"
else
  echo "❌ Password change failed"
  echo $CHANGE_RES
  exit 1
fi

# 7. Login with new password
echo "7. Logging in with new password..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$NEW_PASSWORD\"}")

NEW_TOKEN=$(echo $LOGIN_RES | jq -r '.data.token')

if [ "$NEW_TOKEN" != "null" ]; then
  echo "✅ Logged in with new password"
else
  echo "❌ Login failed"
  echo $LOGIN_RES
  exit 1
fi

echo "🎉 All tests passed!"
