# Content Broadcasting System

A backend system for educational institutions that allows teachers to upload subject-based content (question papers, announcements, materials) which gets approved by principals and broadcasted to students via a public API with intelligent scheduling and rotation logic.

## Live Demo

[Content-Broadcasting-Api-link](https://content-brocasting-system.onrender.com)

## Api Documentation

[Postman-documentaion](https://documenter.getpostman.com/view/33104609/2sBXqJJfxq)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [folder Structure](#folder-structure)
- [Database Setup](#database-setup)
- [Testing](#testing)
- [Assumptions & Decisions](#assumptions--decisions)
- [Skipped Features](#skipped-features)
- [Future Improvements](#future-improvements)

## Features

### Core Features

- **Authentication & RBAC** - JWT-based authentication with role-based access (Principal/Teacher)
- **Content Upload** - Teachers can upload images (JPG, PNG, GIF) with metadata
- **Approval Workflow** - Principals approve/reject content with rejection reasons
- **Smart Scheduling** - Content visible only within teacher-defined time windows
- **Rotation Logic** - Multiple content per subject rotates based on duration
- **Public Broadcasting API** - Students access live content without authentication
- **Subject-based Filtering** - Filter content by subject for targeted broadcasting

## Tech Stack

| Category           | Technology                       |
| ------------------ | -------------------------------- |
| **Runtime**        | Node.js (v18+)                   |
| **Framework**      | Express.js                       |
| **Database**       | PostgreSQL (Supabase)            |
| **Storage**        | Supabase Storage (S3-compatible) |
| **Authentication** | JWT + bcrypt                     |
| **File Upload**    | Multer                           |
| **Language**       | JavaScript (ES Modules)          |
| **Deployment**     | [To be added]                    |

## Architecture Overview

| API LAYER | -> |/api/auth │ /api/content │ /api/schedule │ /api/broadcast│

│ SERVICE LAYER │-> │ AuthService │ ContentService │ SchedulingService │ StorageService│

│ DATA LAYER │ -> │ PostgreSQL (Supabase) │ Supabase Storage (Files) │

### Authentication Flow

1. User registers/login → Server validates credentials
2. Server generates JWT token with user ID, email, role
3. Client includes token in `Authorization: Bearer <token>` header
4. Middleware verifies token and attaches user to request
5. Role middleware restricts access based on user role

### Scheduling & Rotation Logic

The system implements a time-based rotation algorithm:

1. All approved content for a subject is collected
2. Each content has a duration (default 5 minutes)
3. Total cycle time = sum of all durations
4. Current position = (current_time_in_minutes) % total_cycle_time
5. Content is active where accumulated_time ≤ position < accumulated_time + duration

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Supabase account (free tier works)
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/content-broadcast-system.git

cd content-broadcast-system

npm install
```

### 2. Env Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_EXPIRES_IN=7d

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
UPLOAD_DIR=uploads

# Scheduling
DEFAULT_ROTATION_DURATION=5
```

### 3.Start server

```bash
npm run dev
```


## folder Structure
```bash
content-broadcast-system/
├── src/
│   ├── config/
│   │   ├── config.js          
│   │   ├── supabase.js        
│   │   └── validateEnv.js      
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── content.controller.js
│   │   ├── schedule.controller.js
│   │   └── broadcast.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── upload.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── content.model.js
│   │   └── schedule.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── content.routes.js
│   │   ├── schedule.routes.js
│   │   └── broadcast.routes.js
│   ├── services/
│   │   ├── scheduling.service.js
│   │   └── storage.service.js
│   ├── tests/
│   │   ├── testAuth.js
│   │   ├── testContent.js
│   │   ├── testApproval.js
│   │   ├── testScheduling.js
│   │   ├── testBroadcast.js
│   │   └── edgeCases.test.js
│   ├── utils/
│   │   └── dbHelpers.js
│   └── server.js
├── uploads/                    
├── .env                        
├── .gitignore
├── package.json
└── README.md
```


## DataBase Setup

```bash
 CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('principal', 'teacher')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  rotation_duration INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES content(id),
  slot_id UUID REFERENCES content_slots(id),
  rotation_order INTEGER NOT NULL,
  duration INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

```bash
npm run test:all
npm run test:auth        # Authentication tests
npm run test:content     # Content upload tests
npm run test:approval    # Approval workflow tests
npm run test:scheduling  # Scheduling logic tests
npm run test:broadcast   # Public API tests
npm run test:edge        # Edge cases tests
```

## Assumptions & Decisions

1. File Storage: Using Supabase Storage instead of local storage for production readiness
2. Authentication: JWT with 7-day expiry; no refresh token implementation
3. File Types: Only images (JPG, PNG, GIF) as per requirements
4. File Size: 10MB max limit enforced
5. Time Zones: All times stored in UTC; client responsible for conversion
6. Rotation: Default 5 minutes if not specified; max 60 minutes

## Skipped Features

1. Redis Caching: Bonus feature not implemented
2. Rate Limiting: No protection on public API
3. S3 Upload: Using Supabase Storage instead
4. Pagination: All content returned at once (assumes small scale)

## Future Improvements

1. Add Redis caching for broadcast API
2. Implement rate limiting on public endpoints
3. Add pagination for content lists
4. Add email notifications for approval/rejection
5. Real-time WebSocket updates for students
