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