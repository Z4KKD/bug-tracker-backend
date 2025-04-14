# Bug Tracker API 
##Backend RESTful Service

This is the backend API for a Bug Tracker system, built with **Node.js**, **Express**, and **MongoDB**. It provides secure authentication, user role management, and CRUD operations for bug tracking. All data is stored on a cloud-hosted MongoDB instance (e.g. Atlas on AWS), and the API can be tested with **Postman**.

---

## 🚀 Features

- User registration & login with **JWT authentication**
- Role-based access control (admin/user)
- CRUD operations for bugs
- Filtering, pagination, and querying bugs
- Swagger API documentation
- Security middlewares: CORS, Helmet, CSRF, Rate limiting
- Cloud MongoDB connection
- Sanitization and validation using express-validator & xss

---

## 📁 Project Structure

```
project-root
├── config
│   └── db.js          # MongoDB connection
├── middleware
│   └── auth.js        # Auth and role middleware
├── models
│   ├── Bug.js         # Bug schema
│   └── User.js        # User schema + password hashing
├── routes
│   ├── auth.js        # Register/Login routes
│   └── bugs.js        # Bug management routes
├── server.js          # Entry point
├── logger.js          # Winston logger setup
└── .env               # Secrets (MONGO_URI, JWT_SECRET, etc.)
```

---

## 🔐 Authentication & Authorization

JWT tokens are required for any bug creation, update, or deletion. Each user has a `role` of either `admin` or `user`, and the role is checked with middleware.

### Register
```
POST /api/auth/register
```
**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "admin" // optional, defaults to "user"
}
```

### Login
```
POST /api/auth/login
```
**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "..."
}
```

---

## 🐛 Bug Routes

### Get All Bugs (public)
```
GET /api/bugs
```
Supports query parameters:
- `page`, `limit`
- `priority`, `status`, `assignedTo`
- `startDate`, `endDate`

### Create Bug (auth required)
```
POST /api/bugs
Authorization: Bearer <JWT>
```
**Body:**
```json
{
  "title": "Login error",
  "description": "500 error on login",
  "priority": "High",
  "reporter": "john@example.com",
  "assignedTo": "dev@example.com"
}
```

### Update Bug (auth required)
```
PUT /api/bugs/:id
```

### Delete Bug (auth required)
```
DELETE /api/bugs/:id
```

### Update Status (auth required)
```
PUT /api/bugs/:id/status
```
**Body:**
```json
{
  "status": "Resolved"
}
```

---

## 🛡️ Middleware & Security

- **authMiddleware**: Verifies JWT, checks roles
- **express-validator**: Validates request bodies
- **xss**: Prevents cross-site scripting
- **helmet**: Adds HTTP security headers
- **rateLimit**: Limits repeated requests
- **CSRF**: Token-based CSRF protection
- **CORS**: Allows cross-origin requests from frontend

---

## ☁️ MongoDB Connection

In `config/db.js`:
```js
const conn = await mongoose.connect(process.env.MONGO_URI);
```
Connects to a cloud MongoDB (e.g., MongoDB Atlas on AWS). Requires `.env` file:

### .env Example
```
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
```

---

## 📖 API Docs

Swagger UI is available for exploring the API:
```
GET /api-docs
```

---

## 🧪 Testing with Postman

Use the provided routes with Postman collections. Ensure to set `Authorization` headers where needed:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## ✅ Todo / Improvements

- Add unit tests (Jest)
- Add user-specific bug views
- Add comments/attachments to bugs
- Email notifications
- Frontend in React

---

## 👨‍💻 Author

Zachary Duncan

---

