# Maya HRMS API Documentation

This document details the available API endpoints for the Maya HRMS backend.

## Base URL
`http://localhost:3000/api`

## Authentication
Most endpoints require a Bearer Token in the `Authorization` header.
`Authorization: Bearer <your_access_token>`

---

## 🔐 Auth Module

### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**: `{ "email": "admin@hrms.com", "password": "Admin@1234" }`
- **Response**: `{ "status": "success", "data": { "accessToken": "...", "user": { ... } } }`
- **Notes**: Sets a `refreshToken` cookie.

### Logout
- **URL**: `/auth/login/logout`
- **Method**: `POST`
- **Auth**: Required
- **Response**: `{ "status": "success", "message": "Logged out successfully" }`

### Refresh Token
- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Notes**: Uses the `refreshToken` cookie to issue a new `accessToken`.

### Get Current User
- **URL**: `/auth/me`
- **Method**: `GET`
- **Auth**: Required

---

## 👥 Employees Module

### List Employees
- **URL**: `/employees`
- **Method**: `GET`
- **Auth**: Required (Role: `super_admin`, `hr_agent`, `manager`)
- **Query Params**: `page`, `limit`, `search`, `department`, `status`, `contractType`

### Create Employee
- **URL**: `/employees`
- **Method**: `POST`
- **Auth**: Required (Role: `super_admin`, `hr_agent`)

### Get Employee by ID
- **URL**: `/employees/:id`
- **Method**: `GET`
- **Auth**: Required

---

## 🏖️ Leave Module

### List Leave Types
- **URL**: `/leave-types`
- **Method**: `GET`
- **Auth**: Required

### List Leave Requests
- **URL**: `/leaves`
- **Method**: `GET`
- **Auth**: Required

### Create Leave Request
- **URL**: `/leaves`
- **Method**: `POST`
- **Auth**: Required

---

## 🕒 Time & Attendance

### List Time Entries
- **URL**: `/time`
- **Method**: `GET`
- **Auth**: Required

### Clock In/Out
- **URL**: `/time`
- **Method**: `POST`
- **Auth**: Required

---

## 📄 Documents

### List Templates
- **URL**: `/templates`
- **Method**: `GET`
- **Auth**: Required

### Generate Document
- **URL**: `/documents/generate`
- **Method**: `POST`
- **Auth**: Required

---

## ⚙️ Settings

### Get Company Settings
- **URL**: `/settings`
- **Method**: `GET`
- **Auth**: Required

### Update Settings
- **URL**: `/settings`
- **Method**: `PUT`
- **Auth**: Required (Role: `super_admin`)
