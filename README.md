# Content Broadcasting System

A backend system for educational institutions that allows teachers to upload subject-based content (question papers, announcements, materials) which gets approved by principals and broadcasted to students via a public API with intelligent scheduling and rotation logic.

## Live Demo

[Add your deployment link here after deployment]

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Assumptions & Decisions](#assumptions--decisions)
- [Skipped Features](#skipped-features)
- [Future Improvements](#future-improvements)

## Features {#features}

### Core Features
- **Authentication & RBAC** - JWT-based authentication with role-based access (Principal/Teacher)
- **Content Upload** - Teachers can upload images (JPG, PNG, GIF) with metadata
- **Approval Workflow** - Principals approve/reject content with rejection reasons
- **Smart Scheduling** - Content visible only within teacher-defined time windows
- **Rotation Logic** - Multiple content per subject rotates based on duration
- **Public Broadcasting API** - Students access live content without authentication
- **Subject-based Filtering** - Filter content by subject for targeted broadcasting

### Extra Features Implemented
- Subject-wise analytics dashboard
- Schedule preview API
- Rotation status monitoring
- Content statistics for principals

## Tech Stack {#tech-stack}

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js |
| **Database** | PostgreSQL (Supabase) |
| **Storage** | Supabase Storage (S3-compatible) |
| **Authentication** | JWT + bcrypt |
| **File Upload** | Multer |
| **Language** | JavaScript (ES Modules) |
| **Deployment** | [To be added] |

## Architecture Overview {#architecture-overview}

| API LAYER |  -> |/api/auth │ /api/content │ /api/schedule │ /api/broadcast│
 
│ SERVICE LAYER │->  │ AuthService │ ContentService │ SchedulingService │ StorageService│

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

## Prerequisites {#prerequisites}

- Node.js (v18 or higher)
- npm (v9 or higher)
- Supabase account (free tier works)
- Git

## Installation & Setup {#installation--setup}

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


## Api documentation link {#api-documentation}
1. File Storage: Using Supabase Storage instead of local storage for production readiness
2. Authentication: JWT with 7-day expiry; no refresh token implementation
3. File Types: Only images (JPG, PNG, GIF) as per requirements
4. File Size: 10MB max limit enforced
5. Time Zones: All times stored in UTC; client responsible for conversion
6. Rotation: Default 5 minutes if not specified; max 60 minutes

## Skipped Features {#skipped-features}

1. Redis Caching: Bonus feature not implemented
2. Rate Limiting: No protection on public API
3. S3 Upload: Using Supabase Storage instead
4. Pagination: All content returned at once (assumes small scale)


##  Future Improvements {#future-improvements}

1. Add Redis caching for broadcast API
2. Implement rate limiting on public endpoints
3. Add pagination for content lists
4. Add email notifications for approval/rejection
5. Real-time WebSocket updates for students