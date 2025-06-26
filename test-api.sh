#!/bin/bash

# Doctor Appointment API Testing Script
# Make sure the server is running on http://localhost:5000

BASE_URL="http://localhost:5000/api"
ACCESS_TOKEN=""
ADMIN_TOKEN=""

echo "=== Doctor Appointment API Testing Script ==="
echo "Make sure the server is running on http://localhost:5000"
echo "Run 'npm run seed' first to populate the database"
echo ""

# Test health endpoint
echo "1. Testing Health Endpoint..."
curl -s -X GET "$BASE_URL/../health" | jq '.'
echo -e "\n"

# Test user registration
echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123"
  }')
echo "$REGISTER_RESPONSE" | jq '.'
echo -e "\n"

# Test user login
echo "3. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "User123"
  }')
echo "$LOGIN_RESPONSE" | jq '.'

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
echo "Access Token: $ACCESS_TOKEN"
echo -e "\n"

# Test admin login
echo "4. Testing Admin Login..."
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123"
  }')
echo "$ADMIN_LOGIN_RESPONSE" | jq '.'

# Extract admin token
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | jq -r '.data.accessToken')
echo "Admin Token: $ADMIN_TOKEN"
echo -e "\n"

# Test get current user profile
echo "5. Testing Get Current User Profile..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo -e "\n"

# Test get all doctors
echo "6. Testing Get All Doctors..."
curl -s -X GET "$BASE_URL/doctors?page=1&limit=5" | jq '.'
echo -e "\n"

# Test search doctors
echo "7. Testing Search Doctors..."
curl -s -X GET "$BASE_URL/doctors/search?q=cardiology" | jq '.'
echo -e "\n"

# Test get doctors by specialty
echo "8. Testing Get Doctors by Specialty..."
curl -s -X GET "$BASE_URL/doctors/specialty/Cardiology" | jq '.'
echo -e "\n"

# Test get popular doctors
echo "9. Testing Get Popular Doctors..."
curl -s -X GET "$BASE_URL/doctors/popular?limit=3" | jq '.'
echo -e "\n"

# Test get all specialties
echo "10. Testing Get All Specialties..."
curl -s -X GET "$BASE_URL/doctors/specialties" | jq '.'
echo -e "\n"

# Get a doctor ID for testing
DOCTOR_ID=$(curl -s -X GET "$BASE_URL/doctors?limit=1" | jq -r '.data[0]._id')
echo "Using Doctor ID: $DOCTOR_ID"
echo -e "\n"

# Test get doctor by ID
echo "11. Testing Get Doctor by ID..."
curl -s -X GET "$BASE_URL/doctors/$DOCTOR_ID" | jq '.'
echo -e "\n"

# Test get doctor availability
echo "12. Testing Get Doctor Availability..."
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
curl -s -X GET "$BASE_URL/doctors/$DOCTOR_ID/availability?date=$TOMORROW" | jq '.'
echo -e "\n"

# Test book appointment
echo "13. Testing Book Appointment..."
APPOINTMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"doctorId\": \"$DOCTOR_ID\",
    \"date\": \"$TOMORROW\",
    \"time\": \"10:00\",
    \"reason\": \"Regular checkup\",
    \"notes\": \"Test appointment\",
    \"symptoms\": [\"fatigue\"]
  }")
echo "$APPOINTMENT_RESPONSE" | jq '.'

# Extract appointment ID
APPOINTMENT_ID=$(echo "$APPOINTMENT_RESPONSE" | jq -r '.data._id')
echo "Appointment ID: $APPOINTMENT_ID"
echo -e "\n"

# Test get user appointments
echo "14. Testing Get User Appointments..."
curl -s -X GET "$BASE_URL/appointments/my" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo -e "\n"

# Test get appointment by ID
echo "15. Testing Get Appointment by ID..."
curl -s -X GET "$BASE_URL/appointments/$APPOINTMENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo -e "\n"

# Test admin: get all appointments
echo "16. Testing Admin: Get All Appointments..."
curl -s -X GET "$BASE_URL/appointments" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "\n"

# Test admin: update appointment status
echo "17. Testing Admin: Update Appointment Status..."
curl -s -X PATCH "$BASE_URL/appointments/$APPOINTMENT_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "confirmed"
  }' | jq '.'
echo -e "\n"

# Test admin: get appointment statistics
echo "18. Testing Admin: Get Appointment Statistics..."
curl -s -X GET "$BASE_URL/appointments/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "\n"

# Test admin: get upcoming appointments
echo "19. Testing Admin: Get Upcoming Appointments..."
curl -s -X GET "$BASE_URL/appointments/upcoming?days=7" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "\n"

# Test admin: create new doctor
echo "20. Testing Admin: Create New Doctor..."
NEW_DOCTOR_RESPONSE=$(curl -s -X POST "$BASE_URL/doctors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Dr. Test Doctor",
    "specialty": "General Medicine",
    "qualifications": "MD - Test University",
    "experience": 5,
    "availability": [
      {
        "day": "Monday",
        "startTime": "09:00",
        "endTime": "17:00"
      },
      {
        "day": "Tuesday",
        "startTime": "09:00",
        "endTime": "17:00"
      }
    ],
    "location": {
      "hospital": "Test Hospital",
      "address": "123 Test Street",
      "city": "Test City",
      "state": "TC",
      "zipCode": "12345"
    },
    "contact": {
      "phone": "+1-555-0999",
      "email": "dr.test@test.com"
    },
    "consultationFee": 100
  }')
echo "$NEW_DOCTOR_RESPONSE" | jq '.'

NEW_DOCTOR_ID=$(echo "$NEW_DOCTOR_RESPONSE" | jq -r '.data._id')
echo "New Doctor ID: $NEW_DOCTOR_ID"
echo -e "\n"

# Test admin: get doctor statistics
echo "21. Testing Admin: Get Doctor Statistics..."
curl -s -X GET "$BASE_URL/doctors/$DOCTOR_ID/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "\n"

# Test user: cancel appointment
echo "22. Testing User: Cancel Appointment..."
curl -s -X PATCH "$BASE_URL/appointments/$APPOINTMENT_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "cancellationReason": "No longer needed"
  }' | jq '.'
echo -e "\n"

# Test change password
echo "23. Testing Change Password..."
curl -s -X PUT "$BASE_URL/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "currentPassword": "User123",
    "newPassword": "NewUser123"
  }' | jq '.'
echo -e "\n"

# Test logout
echo "24. Testing Logout..."
curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo -e "\n"

# Test admin: delete doctor
echo "25. Testing Admin: Delete Doctor..."
curl -s -X DELETE "$BASE_URL/doctors/$NEW_DOCTOR_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
echo -e "\n"

echo "=== API Testing Complete ==="
echo "Check the responses above for any errors"
echo "Visit http://localhost:5000/api-docs for complete API documentation" 