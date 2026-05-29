Django News Application — Planning Document

**Project:** News Application (Django Capstone)
**Stack:** Python 3.11 · Django 5.2 · Django REST Framework 3.17 · PostgreSQL

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [System Architecture](#4-system-architecture)
5. [Database Design](#5-database-design)
6. [User Roles & Permission Matrix](#6-user-roles--permission-matrix)
7. [API Design](#7-api-design)
8. [Frontend Design](#8-frontend-design)
9. [Approval Workflow Design](#9-approval-workflow-design)
10. [Signal Architecture](#10-signal-architecture)
11. [Authentication Strategy](#11-authentication-strategy)
12. [Testing Plan](#12-testing-plan)
13. [Implementation Steps](#13-implementation-steps)
14. [File Structure](#14-file-structure)

---

## 1. Project Overview

### Purpose

A multi-role news platform where readers can follow publishers and journalists, journalists write and publish articles, and editors oversee an approval-based content workflow. Third-party API clients (and internal readers) can retrieve articles filtered to their subscriptions.

### Goals

| Goal | Description |
|---|---|
| Role-based access | Three distinct roles with clearly enforced permissions |
| Editorial workflow | Unapproved articles visible only to authors and editors |
| Notification pipeline | Email and X (Twitter) triggered on article approval |
| REST API | Token-authenticated endpoints consumable by any client |
| Scalability baseline | PostgreSQL, normalised schema, query optimisation via `select_related` |

---

## 2. Functional Requirements

### 2.1 User Management

- Users self-register via a sign-up page and choose one of three roles: Reader, Journalist, or Editor.
- After registration, users are automatically assigned to the Django group matching their role.
- Role changes propagate immediately to group membership.
- Reader-only subscription data is cleared when a user's role changes to Journalist or Editor.

### 2.2 Readers

- Browse all approved articles on the homepage and full article listing.
- Subscribe to publishers and individual journalists via a toggle button.
- View a personalised "My Feed" showing only content from subscribed sources.
- Cannot create, edit, delete, or approve any content.

### 2.3 Journalists

- Create articles (submitted unapproved, pending editorial review).
- Edit and delete their own articles only.
- Create, edit, and delete their own newsletters.
- View their own unapproved drafts in "My Articles".
- Cannot approve any articles.

### 2.4 Editors

- View, edit, and delete any article (regardless of author).
- Access an editorial approval dashboard listing all pending articles.
- Approve and unapprove individual articles.
- View, edit, delete, and create newsletters.
- Cannot create articles via the REST API (spec requirement — article creation is journalists only).

### 2.5 Article Approval

- Approving an article sets `approved = True`, records the approving editor and timestamp.
- Approval triggers two side-effects (via Django signals):
  1. Email notification to all subscribed readers.
  2. POST request to X (Twitter) v2 API.
- Unapproving clears `approved_by` and `approved_at`.

### 2.6 REST API

- Token-authenticated endpoints for articles, newsletters, publishers, and users.
- Article listing filtered by role (readers see approved only; journalists see own + approved; editors see all).
- Dedicated `subscribed` endpoint returning articles from a reader's subscriptions only.
- Standard CRUD with role-based guards on every method.

---

## 3. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | Passwords hashed (Django PBKDF2). Tokens invalidated on logout. No credentials in source code. |
| Performance | `select_related` / `prefetch_related` used on all multi-join queries. Homepage capped at 20 articles. |
| Reliability | Email backend defaults to console in dev — misconfigured SMTP does not break approval. Twitter errors caught and logged, never raised. |
| Maintainability | PEP 8 throughout. Module-level docstrings. Standalone signal functions for easy mocking. `forms.py` separated from `views.py`. |
| Testability | 38 unit tests. All external I/O (email, Twitter) patched with `unittest.mock`. |
| Portability | PostgreSQL via `DATABASE_URL`; falls back to SQLite for development without a DB server. |

---

## 4. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                  │
│   Browser (HTML/CSS)              API Client (curl / app / frontend)  │
└───────────────┬──────────────────────────────┬───────────────────────┘
                │  Session Cookie               │  Token: Authorization header
                ▼                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        DJANGO APPLICATION                             │
│                                                                       │
│  ┌─────────────────────┐     ┌──────────────────────────────────┐    │
│  │  Template Views      │     │  DRF API Views (ViewSets + APIView)│   │
│  │  (frontend_urls.py)  │     │  (urls.py → views.py)            │    │
│  └──────────┬──────────┘     └──────────────┬───────────────────┘    │
│             │                               │                         │
│  ┌──────────▼───────────────────────────────▼───────────────────┐    │
│  │                    Business Logic Layer                        │    │
│  │  models.py · forms.py · serializers.py · permissions.py       │    │
│  └──────────────────────────────┬───────────────────────────────┘    │
│                                 │                                     │
│  ┌──────────────────────────────▼───────────────────────────────┐    │
│  │                      Signal Layer (signals.py)                │    │
│  │  post_migrate → groups   post_save/User → group assignment    │    │
│  │  post_save/Article → send_approval_emails + post_to_twitter   │    │
│  └──────────────────────────────┬───────────────────────────────┘    │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
              ┌───────────────────┼──────────────────────┐
              ▼                   ▼                       ▼
      ┌──────────────┐   ┌──────────────┐     ┌──────────────────────┐
      │  PostgreSQL   │   │ Email Server │     │ X (Twitter) v2 API   │
      │  (DATABASE_   │   │ (SMTP /      │     │ POST /2/tweets       │
      │   URL)        │   │  console)    │     │ Bearer Token auth    │
      └──────────────┘   └──────────────┘     └──────────────────────┘
```

---

## 5. Database Design

### 5.1 Entity-Relationship Summary

```
Publisher ──< (editors) ──── User
Publisher ──< (journalists) ── User
Publisher ──< Article
User (journalist/editor) ──< Article
User (editor) ──< Article (approved_by)
User (reader) ──< (subscribed_publishers) ──── Publisher
User (reader) ──< (subscribed_journalists) ──── User
User (journalist/editor) ──< Newsletter
Newsletter >──< Article
```

### 5.2 Table Definitions

#### `newsapp_user` (extends `auth_user`)

| Column | Type | Notes |
|---|---|---|
| id | BigInt PK | Auto |
| username | VARCHAR(150) | Unique |
| email | VARCHAR(254) | Optional |
| password | VARCHAR(128) | PBKDF2 hashed |
| role | VARCHAR(20) | reader / journalist / editor |
| (all AbstractUser fields) | — | first_name, last_name, is_staff, etc. |

#### `newsapp_user_subscribed_publishers` (M2M)

| Column | Type |
|---|---|
| user_id | FK → newsapp_user |
| publisher_id | FK → newsapp_publisher |

#### `newsapp_user_subscribed_journalists` (M2M self-referential)

| Column | Type |
|---|---|
| from_user_id | FK → newsapp_user |
| to_user_id | FK → newsapp_user |

#### `newsapp_publisher`

| Column | Type | Notes |
|---|---|---|
| id | BigInt PK | Auto |
| name | VARCHAR(255) | Unique |

#### `newsapp_publisher_editors` (M2M)

| Column | Type |
|---|---|
| publisher_id | FK → newsapp_publisher |
| user_id | FK → newsapp_user (role=editor) |

#### `newsapp_publisher_journalists` (M2M)

| Column | Type |
|---|---|
| publisher_id | FK → newsapp_publisher |
| user_id | FK → newsapp_user (role=journalist) |

#### `newsapp_article`

| Column | Type | Notes |
|---|---|---|
| id | BigInt PK | Auto |
| title | VARCHAR(500) | |
| content | TEXT | |
| author_id | FK → newsapp_user | journalist or editor |
| publisher_id | FK → newsapp_publisher | nullable (independent) |
| created_at | TIMESTAMP | auto_now_add |
| approved | BOOLEAN | default False |
| approved_by_id | FK → newsapp_user | nullable, editor only |
| approved_at | TIMESTAMP | nullable |

**Normalisation note:** Approval metadata is on the Article table itself rather than a separate `ApprovalEvent` table because the spec calls for a single current approval state. An audit log table could be added for history.

#### `newsapp_newsletter`

| Column | Type | Notes |
|---|---|---|
| id | BigInt PK | Auto |
| title | VARCHAR(500) | |
| description | TEXT | |
| created_at | TIMESTAMP | auto_now_add |
| author_id | FK → newsapp_user | journalist or editor |

#### `newsapp_newsletter_articles` (M2M)

| Column | Type |
|---|---|
| newsletter_id | FK → newsapp_newsletter |
| article_id | FK → newsapp_article |

### 5.3 Normalisation

- **1NF** — All columns are atomic; no repeating groups.
- **2NF** — No partial dependencies (all non-key columns depend on the full primary key).
- **3NF** — No transitive dependencies. `approved_by` and `approved_at` depend directly on the article's primary key, not on another non-key field.
- **M2M junction tables** are used for all many-to-many relationships (subscriptions, publisher staff, newsletter articles).

---

## 6. User Roles & Permission Matrix

### 6.1 Django Group Permissions

| Permission | Reader | Journalist | Editor |
|---|---|---|---|
| `view_article` | ✅ | ✅ | ✅ |
| `add_article` | ❌ | ✅ | ❌ |
| `change_article` | ❌ | ✅ | ✅ |
| `delete_article` | ❌ | ✅ | ✅ |
| `view_newsletter` | ✅ | ✅ | ✅ |
| `add_newsletter` | ❌ | ✅ | ✅ |
| `change_newsletter` | ❌ | ✅ | ✅ |
| `delete_newsletter` | ❌ | ✅ | ✅ |

### 6.2 Runtime Access Control (DRF + Decorators)

Object-level rules applied at runtime — Django group permissions are a coarse gate; these are the precise rules:

| Action | Reader | Journalist | Editor |
|---|---|---|---|
| GET /api/articles/ | Approved only | Own + approved | All |
| POST /api/articles/ | ❌ 403 | ✅ | ❌ 403 |
| PUT/PATCH article | ❌ 403 | Own only | Any |
| DELETE article | ❌ 403 | Own only | Any |
| POST /approve/ | ❌ 403 | ❌ 403 | ✅ |
| GET /api/articles/subscribed/ | ✅ | ❌ 403 | ❌ 403 |
| POST /api/newsletters/ | ❌ 403 | ✅ | ✅ |
| PUT/DELETE newsletter | ❌ 403 | Own only | Any |

### 6.3 Group Auto-Assignment Flow

```
User.save()
    └─► post_save signal fires (assign_user_to_group)
            ├─► Remove user from [Reader, Journalist, Editor] groups
            └─► Add user to group matching user.role
```

---

## 7. API Design

### 7.1 Design Decisions

| Decision | Rationale |
|---|---|
| DRF `DefaultRouter` | Auto-generates collection + detail URLs for all four ViewSets |
| Token authentication | Stateless; suitable for third-party API clients |
| DRF `SearchFilter` + `OrderingFilter` | No custom code required for search/sort |
| Pagination | DRF default page-based pagination on all list endpoints |
| `select_related` on querysets | Prevents N+1 queries on author/publisher lookups |
| Read-only approval fields | `approved`, `approved_by`, `approved_at` set only via dedicated actions |

### 7.2 Endpoint Summary

```
/api/
├── auth/
│   ├── register/          POST   — create account + token
│   ├── login/             POST   — authenticate + token
│   └── logout/            POST   — delete token
├── articles/
│   ├── (list)             GET    — role-filtered listing
│   │                      POST   — journalists only
│   ├── subscribed/        GET    — reader's subscribed feed
│   └── <id>/
│       ├── (detail)       GET / PUT / PATCH / DELETE
│       ├── approve/       POST   — editor only
│       └── unapprove/     POST   — editor only
├── newsletters/
│   ├── (list)             GET / POST
│   └── <id>/              GET / PUT / PATCH / DELETE
├── publishers/
│   └── (list + detail)    GET (read-only for non-admin)
└── users/
    └── (list + detail)    GET (scoped by role)
```

### 7.3 Error Response Format

All errors follow DRF's standard envelope:

```json
{ "detail": "Only editors can approve articles." }
```

Validation errors return field-keyed dicts:

```json
{ "title": ["This field is required."] }
```

---

## 8. Frontend Design

### 8.1 Page Inventory

| Page | URL | Template |
|---|---|---|
| Homepage | `/` | `home.html` — hero + 20-article card grid |
| Sign up | `/signup/` | `signup.html` — role picker cards |
| Log in | `/login/` | `login.html` |
| Article list | `/articles/` | `article_list.html` |
| Article detail | `/articles/<id>/` | `article_detail.html` |
| Create article | `/articles/new/` | `article_form.html` |
| Edit article | `/articles/<id>/edit/` | `article_form.html` |
| Approval dashboard | `/articles/approval/` | `article_approval.html` |
| Newsletter list | `/newsletters/` | `newsletter_list.html` |
| My Feed | `/my-feed/` | `my_feed.html` |
| My Articles | `/my-articles/` | `my_articles.html` |

### 8.2 Navigation Logic

```
All users:          Home | Articles | Newsletters
Reader (logged in): + My Feed
Journalist:         + My Articles | Write Article
Editor:             + My Articles | Approval Dashboard
Logged out:         [Sign In]  [Sign Up]
Logged in:          username (role badge)  [Sign Out]
```

### 8.3 UI/UX Decisions

| Decision | Rationale |
|---|---|
| Role picker cards on sign-up (not a plain dropdown) | Communicates role differences visually at registration |
| Featured hero article on homepage | Standard news site pattern; highlights the latest content |
| Sticky header | Persistent navigation for long article pages |
| Flash messages (Django `messages`) | Immediate feedback on approve, create, delete, subscribe actions |
| Approve/unapprove POST-only (no GET) | Prevents CSRF via link-clicking; `@require_POST` enforced |
| Unapproved articles → 404 for non-privileged users | Prevents URL-guessing of draft content |

---

## 9. Approval Workflow Design

```
Journalist writes article
        │
        ▼
Article saved (approved=False)
        │
        ▼
Visible in: Journalist's "My Articles" + Editor's approval dashboard
NOT visible in: Homepage, public article list, reader's feed
        │
        ▼
Editor opens /articles/approval/
        │
        ├── Clicks APPROVE
        │       │
        │       ▼
        │   article.approved = True
        │   article.approved_by = request.user
        │   article.approved_at = now()
        │   article.save()  ────────► post_save signal fires
        │                                   │
        │                          ┌────────┴────────┐
        │                          ▼                  ▼
        │                  send_approval_emails   post_to_twitter
        │                  (all subscribed        (X/Twitter v2
        │                   readers emailed)       Bearer token)
        │
        ├── Clicks UNAPPROVE
        │       │
        │       ▼
        │   article.approved = False
        │   article.approved_by = None
        │   article.approved_at = None
        │   article.save()  (signal fires but approved=False → no side-effects)
        │
        ▼
Approved article appears on homepage + public listing + reader feeds
```

---

## 10. Signal Architecture

Three signal handlers are registered in `signals.py` and connected via `NewsappConfig.ready()`.

### Signal 1 — `create_groups_and_permissions` (`post_migrate`)

**When:** After every `manage.py migrate` run.
**What:** Idempotently creates the three role groups and assigns the correct model permissions to each.
**Why `post_migrate`:** Model content types are guaranteed to exist only after migrations complete.

### Signal 2 — `assign_user_to_group` (`post_save` → User)

**When:** Any time a User instance is saved (create or update).
**What:** Clears the user from all three role groups, then adds them to the group matching `user.role`.
**Why signal (not model method):** Keeps M2M group management decoupled from the model's `save()` method; avoids side-effects during bulk operations that bypass `save()`.

### Signal 3 — `on_article_saved` (`post_save` → Article)

**When:** Any time an Article is saved.
**What:** If `article.approved` is True, calls `send_approval_emails(article)` then `post_to_twitter(article)`.
**Why standalone functions (not inline):** `send_approval_emails` and `post_to_twitter` can be patched independently with `unittest.mock.patch` without replacing the entire signal handler.
**Error handling:** `send_mail` uses `fail_silently=True`; `requests.post` is wrapped in `try/except RequestException` — neither can interrupt the approval save.

---

## 11. Authentication Strategy

### Frontend (HTML interface)

- Django's built-in session authentication.
- `LoginView` / `LogoutView` from `django.contrib.auth.views`.
- `@login_required` decorator guards all write views.
- Custom `SignUpForm` logs the user in immediately after registration.

### REST API

- DRF `TokenAuthentication`.
- One token per user, stored in `authtoken_token` table.
- Token issued on `/api/auth/register/` and `/api/auth/login/`.
- Token deleted (invalidated) on `/api/auth/logout/`.
- All protected API endpoints return 401 if the token is missing or invalid.

### Why not JWT?

DRF's built-in token authentication is sufficient for the capstone requirements, avoids extra dependencies, and integrates natively with Django's auth system. JWT would add stateless refresh token logic that is not required here.

---

## 12. Testing Plan

### Coverage Targets

| Area | Strategy |
|---|---|
| Role-based API access | One test per role per restricted action |
| Queryset scoping | Assert that unapproved articles do not appear for readers |
| Object-level permissions | Journalist cannot patch another journalist's article |
| Signal side-effects | `@patch` on `send_approval_emails` and `post_to_twitter` |
| Email content | Assert correct recipient email address in `send_mail` call args |
| Twitter URL | Assert `requests.post` called with `https://api.twitter.com/2/tweets` |
| Failure paths | Network error in `post_to_twitter` returns None (no exception raised) |
| Model properties | `is_reader`, `is_journalist`, `is_editor`, `is_independent` |
| Data integrity | Subscription fields cleared on role change |

### Test Class Summary

| Class | Tests |
|---|---|
| `AuthenticationTests` | 7 |
| `ReaderTests` | 3 |
| `JournalistTests` | 6 |
| `EditorTests` | 7 |
| `NewsletterTests` | 5 |
| `SignalTests` | 6 |
| `ModelTests` | 4 |
| **Total** | **38** |

### Running Tests

```bash
python manage.py test newsapp              # all 38 tests
python manage.py test newsapp --verbosity=2  # with docstring descriptions
```

---

## 13. Implementation Steps

The project was built in the following order to ensure each layer was stable before the next was added:

| Step | Task | Files Created / Modified |
|---|---|---|
| 1 | Django project and app scaffold | `news_project/`, `newsapp/`, `manage.py` |
| 2 | Custom User model with role field | `models.py`, `settings.py` (AUTH_USER_MODEL) |
| 3 | Publisher, Article, Newsletter models | `models.py` |
| 4 | Initial migration | `newsapp/migrations/0001_initial.py` |
| 5 | Admin registration | `admin.py` |
| 6 | Django groups + permissions signal | `signals.py`, `apps.py` |
| 7 | DRF serializers | `serializers.py` |
| 8 | DRF permission classes | `permissions.py` |
| 9 | API ViewSets (User, Publisher, Article, Newsletter) | `views.py`, `urls.py` |
| 10 | Auth API endpoints (register, login, logout) | `views.py`, `urls.py` |
| 11 | Token authentication configuration | `settings.py` |
| 12 | Article approval signal (email + Twitter) | `signals.py` |
| 13 | 38 unit tests (all passing) | `tests.py` |
| 14 | HTML templates (base, home, articles) | `templates/newsapp/` |
| 15 | Frontend views and URL routing | `views.py`, `frontend_urls.py` |
| 16 | Sign-up page with role selection | `views.py`, `forms.py`, `templates/` |
| 17 | My Feed + subscription toggles | `views.py`, `frontend_urls.py` |
| 18 | My Articles + article CRUD forms | `views.py`, `forms.py` |
| 19 | Editorial approval dashboard | `views.py`, `templates/` |
| 20 | Seed data command (20 articles) | `management/commands/seed_data.py` |
| 21 | PEP 8 pass + docstrings across all modules | All `.py` files |
| 22 | User→group auto-assignment signal | `signals.py` |

---

## 14. File Structure

```
django-news/
│
├── README.md                          ← Setup and usage guide
├── PLANNING.md                        ← This document
├── manage.py
├── requirements.txt
├── .env.example
│
├── news_project/                      ← Django project config
│   ├── __init__.py
│   ├── settings.py                    ← DB, DRF, email, Twitter settings
│   ├── urls.py                        ← Root URL routing
│   ├── wsgi.py
│   └── asgi.py
│
└── newsapp/                           ← Main application
    ├── __init__.py
    ├── apps.py                        ← AppConfig; connects signals
    ├── models.py                      ← User, Publisher, Article, Newsletter
    ├── admin.py                       ← Admin with bulk approve/unapprove
    ├── serializers.py                 ← DRF serializers for all models
    ├── permissions.py                 ← Custom DRF permission classes
    ├── signals.py                     ← Groups, user→group, approval signals
    ├── forms.py                       ← SignUpForm, ArticleForm
    ├── views.py                       ← API ViewSets + template views
    ├── urls.py                        ← REST API routes (/api/*)
    ├── frontend_urls.py               ← HTML template routes
    ├── tests.py                       ← 38 unit tests
    │
    ├── templates/newsapp/
    │   ├── base.html                  ← Sticky header, nav, messages
    │   ├── home.html                  ← Hero + card grid (20 articles)
    │   ├── signup.html                ← Role picker + registration form
    │   ├── login.html                 ← Session login form
    │   ├── article_list.html          ← Full article listing
    │   ├── article_detail.html        ← Single article + controls
    │   ├── article_form.html          ← Shared create/edit form
    │   ├── article_approval.html      ← Editor approval dashboard
    │   ├── newsletter_list.html       ← Newsletter index
    │   ├── my_feed.html               ← Reader feed + subscription sidebar
    │   └── my_articles.html           ← Journalist/editor article table
    │
    └── management/
        └── commands/
            └── seed_data.py           ← 4 demo users, 20 articles, 2 newsletters
```
