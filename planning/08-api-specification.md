# API Specification Document
## The Press Room — News Portal Platform

**Base URL:** `/api`  
**Authentication:** Bearer JWT in the `Authorization` header  
**Content-Type:** `application/json`

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

Tokens are obtained from `/auth/register` or `/auth/login`.  
Tokens expire after **7 days**.

---

## Error Response Format

All errors return a JSON object with a single `error` field:
```json
{ "error": "Descriptive error message" }
```

### Standard HTTP Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing or invalid JWT |
| 403 | Forbidden — authenticated but wrong role |
| 404 | Not Found — resource does not exist |
| 500 | Internal Server Error — unexpected server error |

---

## Endpoints

### Auth

#### POST /auth/register
Create a new user account.

**Access:** Public  
**Request Body:**
```json
{
  "username": "ben_reporter",
  "email": "ben@pressroom.com",
  "password": "password123",
  "role": "journalist"
}
```
**Roles:** `reader` | `journalist` | `editor`

**Response 201:**
```json
{
  "user": {
    "id": 2,
    "username": "ben_reporter",
    "email": "ben@pressroom.com",
    "role": "journalist",
    "bio": null,
    "createdAt": "2026-05-21T10:00:00.000Z",
    "articleCount": 0,
    "newsletterCount": 0
  },
  "token": "eyJhbGci..."
}
```
**Errors:** 400 (email taken, username taken, validation)

---

#### POST /auth/login
Authenticate and receive a JWT.

**Access:** Public  
**Request Body:**
```json
{ "email": "ben@pressroom.com", "password": "password123" }
```
**Response 200:** Same shape as register  
**Errors:** 400 (validation), 401 (invalid credentials)

---

#### POST /auth/logout
Confirm logout (stateless — client must discard the token).

**Access:** Authenticated  
**Response 200:**
```json
{ "message": "Logged out successfully" }
```

---

### Articles

#### GET /articles
List all approved articles with optional filtering and pagination.

**Access:** Public  
**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Case-insensitive title search |
| `publisherId` | number | Filter by publisher |
| `authorId` | number | Filter by author |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset (default: 0) |

**Response 200:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "The Future of Democracy",
      "content": "Full article content...",
      "authorId": 2,
      "authorName": "ben_reporter",
      "publisherId": 1,
      "publisherName": "The Daily Record",
      "approved": true,
      "createdAt": "2026-05-21T10:00:00.000Z",
      "updatedAt": "2026-05-21T10:05:00.000Z"
    }
  ],
  "total": 6
}
```

---

#### GET /articles/subscribed
Return approved articles from subscribed publishers and journalists.

**Access:** Authenticated (Reader)  
**Response 200:** Array of article objects (same shape as above)

---

#### GET /articles/pending
Return all unapproved articles awaiting review.

**Access:** Authenticated (Editor only)  
**Response 200:** Array of article objects

---

#### GET /articles/:articleId
Return a single article by ID.

**Access:** Public  
**Response 200:** Single article object  
**Errors:** 404 (not found)

---

#### POST /articles
Create a new article (starts as pending/unapproved).

**Access:** Authenticated (Journalist only)  
**Request Body:**
```json
{
  "title": "My New Article",
  "content": "Article body text...",
  "publisherId": 1
}
```
`publisherId` is optional.

**Response 201:** Created article object  
**Errors:** 400 (validation), 403 (not a journalist)

---

#### PATCH /articles/:articleId
Update an article's title, content, or publisher.

**Access:** Authenticated (Author or Editor)  
**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "publisherId": 2
}
```
**Response 200:** Updated article object  
**Errors:** 400, 403, 404

---

#### DELETE /articles/:articleId
Permanently delete an article.

**Access:** Authenticated (Author or Editor)  
**Response 204:** No content  
**Errors:** 403, 404

---

#### PATCH /articles/:articleId/approve
Set an article's approval status.

**Access:** Authenticated (Editor only)  
**Request Body:**
```json
{ "approved": true }
```
**Response 200:** Updated article object  
**Errors:** 400, 403, 404

---

### Newsletters

#### GET /newsletters
List all newsletters, optionally filtered by author.

**Access:** Public  
**Query Parameters:** `authorId` (optional)  
**Response 200:** Array of newsletter objects

**Newsletter Object:**
```json
{
  "id": 1,
  "title": "Tech Frontiers: AI & Robotics",
  "description": "Weekly deep dives...",
  "authorId": 3,
  "authorName": "cara_fields",
  "createdAt": "2026-05-21T10:00:00.000Z",
  "articleIds": [3, 4],
  "articles": [ ...full article objects... ]
}
```

---

#### POST /newsletters
Create a newsletter with an optional initial article list.

**Access:** Authenticated (Journalist only)  
**Request Body:**
```json
{
  "title": "Tech Frontiers",
  "description": "Weekly coverage...",
  "articleIds": [3, 4]
}
```
**Response 201:** Newsletter object  
**Errors:** 400, 403

---

#### GET /newsletters/:newsletterId
Return a single newsletter with full article details.

**Access:** Public  
**Response 200:** Newsletter object  
**Errors:** 404

---

#### PATCH /newsletters/:newsletterId
Update newsletter fields and/or replace the article list.

**Access:** Authenticated (Author or Editor)  
**Request Body:** (all fields optional; providing `articleIds` replaces the entire list)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "articleIds": [3, 4, 5]
}
```
**Response 200:** Updated newsletter object  
**Errors:** 400, 403, 404

---

#### DELETE /newsletters/:newsletterId
Delete a newsletter and all its article links.

**Access:** Authenticated (Author or Editor)  
**Response 204:** No content  
**Errors:** 403, 404

---

### Publishers

#### GET /publishers
List all publishers with article counts and member IDs.

**Access:** Public  
**Response 200:**
```json
[
  {
    "id": 1,
    "name": "The Daily Record",
    "description": "Breaking news...",
    "createdAt": "2026-05-21T10:00:00.000Z",
    "articleCount": 3,
    "editorIds": [1],
    "journalistIds": [2, 3]
  }
]
```

---

#### POST /publishers
Create a new publisher.

**Access:** Authenticated (Editor or Journalist)  
**Request Body:**
```json
{ "name": "New Publisher", "description": "Description..." }
```
**Response 201:** Publisher object  
**Errors:** 400, 403

---

#### GET /publishers/:publisherId
Return a single publisher.

**Access:** Public  
**Response 200:** Publisher object  
**Errors:** 404

---

#### PATCH /publishers/:publisherId
Update a publisher's name and/or description.

**Access:** Authenticated (Editor only)  
**Response 200:** Updated publisher object  
**Errors:** 400, 403, 404

---

### Subscriptions

#### POST /subscriptions/publishers/:publisherId
Subscribe the current reader to a publisher (idempotent).

**Access:** Authenticated (Reader only)  
**Response 200:** `{ "subscribed": true, "message": "Subscribed to publisher" }`

---

#### DELETE /subscriptions/publishers/:publisherId
Unsubscribe from a publisher.

**Access:** Authenticated  
**Response 200:** `{ "subscribed": false, "message": "Unsubscribed from publisher" }`

---

#### POST /subscriptions/journalists/:journalistId
Subscribe to a journalist (idempotent).

**Access:** Authenticated (Reader only)  
**Response 200:** `{ "subscribed": true, "message": "Subscribed to journalist" }`

---

#### DELETE /subscriptions/journalists/:journalistId
Unsubscribe from a journalist.

**Access:** Authenticated  
**Response 200:** `{ "subscribed": false, "message": "Unsubscribed from journalist" }`

---

#### GET /subscriptions/me
Return all subscriptions for the current user.

**Access:** Authenticated  
**Response 200:**
```json
{
  "publishers": [ ...publisher objects... ],
  "journalists": [ ...user objects... ]
}
```

---

### Users

#### GET /users/me
Return the current user's profile with counts.

**Access:** Authenticated  
**Response 200:** User object with `articleCount` and `newsletterCount`

---

#### PATCH /users/me
Update the current user's username and/or bio.

**Access:** Authenticated  
**Request Body:** (all fields optional)
```json
{ "username": "new_name", "bio": "Updated bio..." }
```
**Response 200:** Updated user object

---

#### GET /users
List users, optionally filtered by role.

**Access:** Public  
**Query Parameters:** `role` — `reader` | `journalist` | `editor`  
**Response 200:** Array of user objects (no password hashes)

---

#### GET /users/:userId
Return a single user's public profile.

**Access:** Public  
**Response 200:** User object with counts  
**Errors:** 404

---

### Stats

#### GET /stats
Platform-wide aggregate counts.

**Access:** Public  
**Response 200:**
```json
{
  "totalArticles": 7,
  "approvedArticles": 6,
  "pendingArticles": 1,
  "totalNewsletters": 2,
  "totalPublishers": 2,
  "totalJournalists": 2,
  "totalReaders": 1,
  "recentApprovals": 6
}
```

---

#### GET /stats/recent-activity
Chronological activity feed of recent articles and newsletters.

**Access:** Public  
**Response 200:**
```json
[
  {
    "id": "nl-2",
    "type": "newsletter_created",
    "title": "Tech Frontiers: AI & Robotics",
    "actorName": "cara_fields",
    "createdAt": "2026-05-21T10:00:00.000Z",
    "articleId": null,
    "newsletterId": 2
  },
  {
    "id": "a-7",
    "type": "article_published",
    "title": "The Architecture of Loneliness",
    "actorName": "ben_reporter",
    "createdAt": "2026-05-21T09:58:00.000Z",
    "articleId": 7,
    "newsletterId": null
  }
]
```
`type` values: `article_published` | `article_created` | `newsletter_created`
