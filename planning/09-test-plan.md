# Test Plan
## The Press Room — News Portal Platform

---

## 1. Overview

This document outlines the testing strategy for The Press Room, covering unit tests for business logic, integration tests for API endpoints, and end-to-end tests for critical user flows.

---

## 2. Scope

### In Scope
- All REST API endpoints (auth, articles, newsletters, publishers, subscriptions, users, stats)
- Authentication and authorisation middleware
- Role-based access control enforcement
- Input validation (Zod schemas)
- Database interactions via Drizzle ORM
- Frontend React components and page flows (E2E)

### Out of Scope
- Third-party service integrations (email delivery, X/Twitter posting)
- Browser compatibility testing beyond modern Chrome/Firefox
- Load/performance testing

---

## 3. Test Levels

### 3.1 Unit Tests
Test individual functions in isolation with mocked dependencies.

**Target functions:**
- `signToken()` — verify the JWT contains the correct payload
- `verifyToken()` — verify it throws on invalid/expired tokens
- `hashPassword()` — verify output is a bcrypt hash of correct length
- `comparePassword()` — verify correct/incorrect passwords
- `buildArticle()` — verify it shapes the output correctly given mocked DB rows
- `buildNewsletter()` — verify all linked articles are returned (not just the first)
- `buildPublisher()` — verify article count and member IDs are included

**Testing framework:** Vitest  
**Mocking:** Vitest `vi.mock()` for database calls

---

### 3.2 Integration Tests
Test complete HTTP request/response cycles against a test database.

**Setup:**
- Spin up an in-memory or isolated PostgreSQL test database
- Run Drizzle migrations before each test suite
- Seed test users (one per role), one publisher, and a sample article
- Tear down after each suite

---

## 4. Test Cases by Role

### 4.1 Authentication

| ID | Description | Input | Expected Output |
|----|-------------|-------|----------------|
| T-AUTH-01 | Register with valid data | Valid username/email/password/role | 201, JWT returned |
| T-AUTH-02 | Register with duplicate email | Existing email | 400, "Email already in use" |
| T-AUTH-03 | Register with duplicate username | Existing username | 400, "Username already taken" |
| T-AUTH-04 | Register with missing fields | No password | 400, validation error |
| T-AUTH-05 | Login with correct credentials | Valid email + password | 200, JWT returned |
| T-AUTH-06 | Login with wrong password | Valid email, wrong password | 401, generic error |
| T-AUTH-07 | Login with unknown email | Non-existent email | 401, generic error (same message — no enumeration) |
| T-AUTH-08 | Access protected route without token | No Authorization header | 401 |
| T-AUTH-09 | Access protected route with expired token | Expired JWT | 401 |
| T-AUTH-10 | Access protected route with tampered token | Modified JWT | 401 |

---

### 4.2 Editor Role

| ID | Description | Expected Output |
|----|-------------|----------------|
| T-ED-01 | GET /articles/pending as editor | 200, array of unapproved articles |
| T-ED-02 | GET /articles/pending as journalist | 403 |
| T-ED-03 | GET /articles/pending as reader | 403 |
| T-ED-04 | PATCH /articles/:id/approve with `approved: true` | 200, article.approved = true |
| T-ED-05 | PATCH /articles/:id/approve with `approved: false` | 200, article.approved = false |
| T-ED-06 | PATCH /articles/:id/approve as journalist | 403 |
| T-ED-07 | PATCH non-existent article | 404 |
| T-ED-08 | PATCH publisher details as editor | 200, updated publisher |
| T-ED-09 | PATCH publisher details as journalist | 403 |

---

### 4.3 Journalist Role

| ID | Description | Expected Output |
|----|-------------|----------------|
| T-JN-01 | POST /articles as journalist | 201, article with approved=false |
| T-JN-02 | POST /articles as reader | 403 |
| T-JN-03 | POST /articles missing title | 400, validation error |
| T-JN-04 | PATCH own article as journalist | 200, updated article |
| T-JN-05 | PATCH another journalist's article | 403 |
| T-JN-06 | DELETE own article | 204 |
| T-JN-07 | DELETE another journalist's article | 403 |
| T-JN-08 | POST /newsletters as journalist | 201, newsletter created |
| T-JN-09 | POST /newsletters with articleIds | 201, newsletter with articles array |
| T-JN-10 | POST /newsletters as reader | 403 |
| T-JN-11 | PATCH own newsletter | 200, updated newsletter |
| T-JN-12 | DELETE own newsletter | 204 |
| T-JN-13 | PATCH /newsletters with new articleIds | 200, article list replaced |

---

### 4.4 Reader Role

| ID | Description | Expected Output |
|----|-------------|----------------|
| T-RD-01 | POST /subscriptions/publishers/:id as reader | 200, subscribed: true |
| T-RD-02 | POST same subscription twice | 200, subscribed: true (idempotent) |
| T-RD-03 | POST /subscriptions/publishers/:id as journalist | 403 |
| T-RD-04 | DELETE /subscriptions/publishers/:id | 200, subscribed: false |
| T-RD-05 | POST /subscriptions/journalists/:id as reader | 200, subscribed: true |
| T-RD-06 | DELETE /subscriptions/journalists/:id | 200, subscribed: false |
| T-RD-07 | GET /articles/subscribed with no subs | 200, empty array |
| T-RD-08 | GET /articles/subscribed with publisher sub | 200, articles from that publisher |
| T-RD-09 | GET /articles/subscribed with journalist sub | 200, articles from that journalist |
| T-RD-10 | GET /subscriptions/me with multiple subs | 200, all publishers and journalists |

---

### 4.5 Public Endpoints (No Auth)

| ID | Description | Expected Output |
|----|-------------|----------------|
| T-PUB-01 | GET /articles | 200, only approved articles |
| T-PUB-02 | GET /articles?search=climate | 200, matching articles only |
| T-PUB-03 | GET /articles?publisherId=1 | 200, articles from that publisher |
| T-PUB-04 | GET /articles/:id (approved) | 200, article object |
| T-PUB-05 | GET /articles/9999 | 404 |
| T-PUB-06 | GET /publishers | 200, all publishers with counts |
| T-PUB-07 | GET /stats | 200, platform counts |
| T-PUB-08 | GET /stats/recent-activity | 200, activity feed with namespaced IDs |

---

## 5. Newsletter Article Bug Regression Tests

These tests specifically guard against the bug (fixed in this codebase) where only
the first linked article was returned.

| ID | Description | Expected Output |
|----|-------------|----------------|
| T-NL-REG-01 | Create newsletter with 3 articleIds | articles array has length 3 |
| T-NL-REG-02 | GET newsletter with 3 linked articles | articles array has length 3 |
| T-NL-REG-03 | Update newsletter replacing 1 article with 2 | articles array has length 2 |

---

## 6. Mocking Strategy

| Dependency | Mocking Approach |
|-----------|-----------------|
| Database | Use a real test PostgreSQL instance; seed/teardown per suite |
| JWT secret | Set `SESSION_SECRET=test-secret` in test environment |
| `Date.now()` | Use `vi.setSystemTime()` for time-sensitive tests |
| Email service | Not implemented — no mocking required |
| X/Twitter API | Not implemented — no mocking required |

---

## 7. Testing Tools

| Tool | Purpose |
|------|---------|
| Vitest | Unit and integration test runner |
| Supertest | HTTP integration testing against Express app |
| @testing-library/react | React component unit tests |
| Playwright | End-to-end browser testing |

---

## 8. Test Coverage Goals

| Area | Target Coverage |
|------|----------------|
| Auth helpers (lib/auth.ts) | 100% |
| Middleware (requireAuth, requireRole) | 100% |
| API routes (all endpoints) | ≥ 90% |
| React pages (critical flows) | Key user journeys covered by E2E |

---

## 9. End-to-End Test Scenarios (Playwright)

1. **Registration flow** — new user registers as journalist, lands on dashboard
2. **Login flow** — existing user logs in and sees correct role-specific dashboard
3. **Article approval flow** — editor logs in, sees pending article, approves it, article appears in public feed
4. **Write article flow** — journalist writes article, it appears as pending on editor dashboard
5. **Newsletter creation** — journalist creates newsletter with 2 articles, newsletter appears on /newsletters
6. **Subscribe and feed** — reader follows a publisher, their articles appear in the reader's dashboard feed
