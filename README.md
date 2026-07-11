# Car Dealership Inventory System

A full-stack Car Dealership Inventory System built with the MERN stack, featuring JWT authentication, role-based access control, vehicle inventory management, search and filtering, purchase/restock functionality, and Test-Driven Development (TDD).

## Project Structure

- `backend/` - Node.js, Express, MongoDB (Mongoose)
- `frontend/` - React, Vite, Tailwind CSS

## 🧪 Testing

```bash
npm test
```

**Current Status**

| Feature | Status |
|---------|--------|
| Health API | ✅ |
| Register API | ✅ |
| Login API | ✅ |
| JWT Middleware | ✅ Passed |
| Vehicle CRUD | ✅ Passed |


Registration and Login APIs were developed following the Red → Green → Refactor cycle. The final passing test report is included.


## API Examples

### Register User

**Request**

`POST /api/auth/register`

```json
{
  "name": "Prince",
  "email": "senjaliyaprince009@gmail.com",
  "password": "123456"
}
```

**Response (201 Created)**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "name": "Prince",
    "email": "senjaliyaprince009@gmail.com",
    "role": "USER"
  }
}
```

---

### Validation Example

**Request**

```json
{
  "name": "Prince",
  "email": "abc@gmail.com",
  "password": "123"
}
```

**Response (400 Bad Request)**

```json
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}
```

## Login User

**Endpoint**

`POST /api/auth/login`

### Request

```json
{
  "email": "senjaliyaprince009@gmail.com",
  "password": "123456"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "token": "your_jwt_token",
  "user": {
    "_id": "...",
    "name": "Prince",
    "email": "senjaliyaprince009@gmail.com",
    "role": "USER"
  }
}
```

---

### Invalid Password

**Request**

```json
{
  "email": "senjaliyaprince009@gmail.com",
  "password": "111111"
}
```

**Response (401 Unauthorized)**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### Email Not Found

**Request**

```json
{
  "email": "unknown@gmail.com",
  "password": "123456"
}
```

**Response (404 Not Found)**

```json
{
  "success": false,
  "message": "User not found"
}
```

## Protected Route Authentication

### Without Token

```
GET /api/protected
```

Response

```json
{
  "success": false,
  "message": "Access token is required"
}
```

Status

```
401 Unauthorized
```

---

### Invalid Token

```
Authorization: Bearer abc123
```

Response

```json
{
  "success": false,
  "message": "Invalid token"
}
```

Status

```
401 Unauthorized
```

---

### Valid Token

```
Authorization: Bearer <JWT_TOKEN>
```

Response

```json
{
  "success": true,
  "message": "Protected route accessed successfully"
}
```

Status

```
200 OK
```


## TDD Example

### 🔴 Red Phase

Vehicle CRUD tests were written before implementation.

Result:

- 4 Vehicle CRUD tests failed as expected.

### 🟢 Green Phase

After implementing the APIs:

- All Vehicle CRUD tests passed successfully.