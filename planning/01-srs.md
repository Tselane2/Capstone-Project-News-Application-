# Software Requirements Specification (SRS)
## The Press Room — News Portal Platform

**Version:** 1.0  
**Date:** May 2026  
**Status:** Final

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for The Press Room, a full-stack news portal platform. It is intended to serve as a reference for developers, testers, and stakeholders throughout the project lifecycle.

### 1.2 Scope
The Press Room is a web-based news publishing platform that supports three distinct user roles — Reader, Journalist, and Editor. The system allows journalists to write and publish articles and newsletters, editors to review and approve content, and readers to subscribe to publishers and journalists and receive a personalised article feed.

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| JWT | JSON Web Token — used for stateless authentication |
| API | Application Programming Interface |
| SRS | Software Requirements Specification |
| CRUD | Create, Read, Update, Delete |
| ORM | Object-Relational Mapper |
| DRF | Django REST Framework (referenced in brief; this project uses Express) |

### 1.4 Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 24, TypeScript 5.9 |
| API Server | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Authentication | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod (zod/v4), drizzle-zod |
| API Contract | OpenAPI 3.0 (Orval codegen) |
| UI Components | Radix UI + shadcn/ui |

---

## 2. Overall Description

### 2.1 Product Perspective
The Press Room is a standalone web application with a decoupled frontend and backend. The backend exposes a RESTful API consumed by the React frontend. All data is persisted in a PostgreSQL database.

### 2.2 User Classes and Characteristics

| Role | Description | Permissions Summary |
|------|-------------|---------------------|
| **Reader** | End consumers of news content | Browse articles, subscribe to publishers/journalists, access personalised feed |
| **Journalist** | Content creators | Write articles, create newsletters, manage own content |
| **Editor** | Editorial gatekeepers | Approve/reject articles, manage all content, create publishers |

### 2.3 Operating Environment
- Server: Node.js 24 running on Linux
- Database: PostgreSQL 15+
- Browser: Any modern browser supporting ES2020+ (Chrome, Firefox, Safari, Edge)
- Deployment: Replit cloud or any VPS/container environment

### 2.4 Design and Implementation Constraints
- All API routes are prefixed with `/api`
- Authentication is stateless — JWTs are stored client-side in localStorage
- Token expiry is set to 7 days
- Passwords are hashed with bcrypt (12 salt rounds)
- The OpenAPI specification is the single source of truth for the API contract — client hooks and server Zod schemas are generated from it

---

## 3. Functional Requirements

### 3.1 Authentication

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | Users must be able to register with a unique username, unique email address, password, and a selected role (reader/journalist/editor) |
| FR-AUTH-02 | Registered users must be able to log in with their email and password |
| FR-AUTH-03 | The system must return a signed JWT on successful login or registration |
| FR-AUTH-04 | The system must reject login attempts with incorrect credentials with a generic 401 error (no user enumeration) |
| FR-AUTH-05 | Users must be able to log out (client discards token) |

### 3.2 Articles

| ID | Requirement |
|----|-------------|
| FR-ART-01 | Journalists must be able to create articles with a title, content body, and optional publisher association |
| FR-ART-02 | All newly created articles must start with `approved = false` |
| FR-ART-03 | Only approved articles must appear in the public article listing |
| FR-ART-04 | Editors must be able to view a queue of all pending (unapproved) articles |
| FR-ART-05 | Editors must be able to approve or reject any article |
| FR-ART-06 | Articles must be searchable by title (case-insensitive) |
| FR-ART-07 | Articles must be filterable by publisher and by author |
| FR-ART-08 | The system must support pagination on the article listing (limit/offset) |
| FR-ART-09 | Only the original author or an editor may edit or delete an article |

### 3.3 Newsletters

| ID | Requirement |
|----|-------------|
| FR-NL-01 | Journalists must be able to create newsletters with a title, description, and a list of linked article IDs |
| FR-NL-02 | Newsletters must be listable and filterable by author |
| FR-NL-03 | Each newsletter must return its full linked article objects (not just IDs) |
| FR-NL-04 | Only the original author or an editor may edit or delete a newsletter |
| FR-NL-05 | Updating a newsletter with a new articleIds array must replace the existing links entirely |

### 3.4 Publishers

| ID | Requirement |
|----|-------------|
| FR-PUB-01 | Editors and journalists must be able to create publishers with a name and description |
| FR-PUB-02 | Publishers must be publicly listable with their article counts |
| FR-PUB-03 | Only editors may update a publisher's details |

### 3.5 Subscriptions

| ID | Requirement |
|----|-------------|
| FR-SUB-01 | Readers must be able to subscribe to publishers |
| FR-SUB-02 | Readers must be able to subscribe to individual journalists |
| FR-SUB-03 | Subscribing when already subscribed must succeed silently (idempotent) |
| FR-SUB-04 | Readers must be able to unsubscribe from publishers and journalists |
| FR-SUB-05 | The system must provide an endpoint that returns a reader's full subscription list |
| FR-SUB-06 | The system must provide a personalised article feed from all subscribed sources |

### 3.6 Users / Profiles

| ID | Requirement |
|----|-------------|
| FR-USR-01 | Authenticated users must be able to view and update their own profile (username, bio) |
| FR-USR-02 | User profiles must expose article and newsletter counts |
| FR-USR-03 | The system must support filtering the user list by role |

### 3.7 Statistics and Activity Feed

| ID | Requirement |
|----|-------------|
| FR-STAT-01 | The system must expose platform-wide statistics (total articles, pending, approved, newsletters, publishers, journalists, readers) |
| FR-STAT-02 | The system must expose a chronological activity feed of recent articles and newsletter creations |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- API responses for listing endpoints must complete in under 500 ms under normal load
- Parallel database queries must be used wherever independent data is required (e.g. article + author + publisher)
- Pagination must be enforced on all listing endpoints to prevent unbounded query sizes

### 4.2 Security
- Passwords must never be stored in plain text — bcrypt with a minimum of 12 salt rounds is required
- JWT secrets must be loaded from environment variables and never committed to source control
- Authentication errors must use generic messages to prevent user enumeration
- Role enforcement must happen on the server — client-side role checks are for UX only
- CORS is enabled to allow the proxied frontend to communicate with the API

### 4.3 Usability
- The frontend must be fully responsive and readable on screens from 375 px wide upward
- Navigation must reflect the current user's role (editors see approval links, journalists see write/dashboard)
- Loading and error states must be shown for all asynchronous data fetches

### 4.4 Reliability
- All route handlers must be wrapped in try/catch and forward errors to the global error handler
- The global error handler must return a structured JSON error response — no raw stack traces to the client
- Database connection failures must be logged and the server must exit with a non-zero code

### 4.5 Maintainability
- The API contract (OpenAPI spec) is the single source of truth — Zod schemas and React Query hooks are generated, not hand-written
- All helper functions must have JSDoc comments
- Code must pass TypeScript strict-mode type checking with zero errors

### 4.6 Scalability
- The stateless JWT design allows horizontal scaling (multiple API server instances behind a load balancer) without shared session state
- Database connection pooling is configured via Drizzle ORM's pg pool

---

## 5. System Constraints

- The database must be PostgreSQL (not MariaDB or SQLite)
- The backend must be Express 5 on Node.js 24
- TypeScript strict mode must be enabled across all packages
- All API types must be generated from the OpenAPI spec — manual fetch calls are not permitted in the frontend
- Environment variables `DATABASE_URL` and `SESSION_SECRET` are required at runtime
