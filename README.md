# Django News Application

A full-featured news platform built with Django 5 and Django REST Framework. Supports three user roles (Reader, Journalist, Editor) with role-based access control, an editorial article approval workflow, a REST API with token authentication, Django signals for email and Twitter/X notifications, and a responsive HTML frontend.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Clone the Repository](#clone-the-repository)
5. [Virtual Environment](#virtual-environment)
6. [Install Dependencies](#install-dependencies)
7. [Environment Variables (.env)](#environment-variables-env)
8. [Database Configuration](#database-configuration)
9. [Apply Migrations](#apply-migrations)
10. [Create a Superuser](#create-a-superuser)
11. [Load Demo Data](#load-demo-data)
12. [Run the Development Server](#run-the-development-server)
13. [Switching to MariaDB (Production)](#switching-to-mariadb-production)
14. [Project Structure](#project-structure)
15. [Demo Accounts](#demo-accounts)
16. [User Roles & Permissions](#user-roles--permissions)
17. [Article Approval Workflow](#article-approval-workflow)
18. [Django Signals](#django-signals)
19. [REST API Reference](#rest-api-reference)
20. [Frontend Routes](#frontend-routes)
21. [Running Tests](#running-tests)

---

## Features

- **Role-based access control** — Reader, Journalist, and Editor roles with distinct Django groups and permissions
- **Article approval workflow** — editors review, approve, and unapprove articles through a dedicated dashboard
- **Django signals** — article approval triggers subscriber email notifications and an X (Twitter) post
- **REST API** — full CRUD API with DRF token authentication, role-scoped querysets, and search/ordering
- **Subscriptions** — readers subscribe to publishers and journalists; a personalised feed surfaces only subscribed content
- **Newsletters** — journalists and editors curate and manage collections of approved articles
- **Responsive UI** — sticky header with role-aware navigation, featured article hero, card grid homepage
- **38 unit tests** — covering all roles, permissions, signals (mocked), and model behaviour

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, Django 5.2 |
| REST API | Django REST Framework 3.17 |
| Database (development) | SQLite (built-in, no setup required) |
| Database (production) | MariaDB / MySQL |
| Auth | Django session auth (frontend) + DRF Token auth (API) |
| HTTP client | `requests` (Twitter/X integration) |
| Email | Django `send_mail` (console backend by default) |

---

## Prerequisites

Before setting up the project, ensure the following are installed on your machine:

- **Python 3.11 or higher** — [python.org/downloads](https://www.python.org/downloads/)
- **pip** — included with Python 3.11+
- **Git** — [git-scm.com](https://git-scm.com/)

> **No database server is required for development.** The project uses SQLite out of the box — Django creates the database file automatically when you run migrations. MariaDB is only needed for production deployment (see [Switching to MariaDB](#switching-to-mariadb-production)).

---

## Clone the Repository

> **Important:** The folder created by `git clone` must match the GitHub repository name exactly. Django's project configuration references the folder name for module resolution. Do not rename the cloned directory.

```bash
git clone <repository-url>
cd <repository-name>
```

Replace `<repository-url>` with your actual GitHub repository URL (e.g. `https://github.com/your-username/your-repo-name.git`).

All subsequent commands assume you are inside the `django-news/` subdirectory (the directory that contains `manage.py`):

```bash
cd django-news
```

---

## Virtual Environment

A virtual environment isolates your project's Python dependencies from your system Python.

### Create the virtual environment

```bash
python -m venv venv
```

### Activate the virtual environment

**macOS / Linux:**

```bash
source venv/bin/activate
```

**Windows (Command Prompt):**

```bash
venv\Scripts\activate
```

**Windows (PowerShell):**

```bash
venv\Scripts\Activate.ps1
```

Your terminal prompt will change to show `(venv)` when the environment is active. Always activate the virtual environment before running any `python` or `pip` commands for this project.

---

## Install Dependencies

With the virtual environment active, install all required packages from `requirements.txt`:

```bash
pip install -r requirements.txt
```

This installs Django, Django REST Framework, python-decouple, requests, and all other project dependencies.

To verify the installation succeeded:

```bash
pip list
```

---

## Environment Variables (.env)

The project reads configuration from a `.env` file located in the `django-news/` directory (the same folder as `manage.py`).

### Step 1 — Create the .env file

Copy the provided example file:

```bash
cp .env.example .env
```

### Step 2 — Fill in your values

Open `.env` in a text editor and configure each variable:

```env
# -----------------------------------------------------------------------
# Django core
# -----------------------------------------------------------------------

# A long, random, secret string used by Django to sign cookies and tokens.
# Generate one with:
#   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
SECRET_KEY=your-secret-key-here

# Set to True during development. ALWAYS set to False in production.
DEBUG=True

# -----------------------------------------------------------------------
# Email (optional)
# -----------------------------------------------------------------------

# Use the console backend during development — emails print to the terminal.
# For production SMTP, change to: django.core.mail.backends.smtp.EmailBackend
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# The "From" address used when sending approval notification emails.
DEFAULT_FROM_EMAIL=noreply@newsapp.example.com

# -----------------------------------------------------------------------
# Twitter / X (optional)
# -----------------------------------------------------------------------

# Bearer token for the Twitter API v2. Leave blank to skip Twitter posting.
TWITTER_BEARER_TOKEN=
```

> **Note on SECRET_KEY:** Never commit your real `.env` file to version control. The `.gitignore` file already excludes it. Use a unique, randomly generated secret key for every environment.

---

## Database Configuration

### Development — SQLite (default, no setup needed)

The project is pre-configured to use SQLite for development. No database server installation is required. Django automatically creates `db.sqlite3` in the `django-news/` directory the first time you run migrations.

The active configuration in `settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Production — MariaDB (commented out, ready to activate)

When you are ready to deploy with MariaDB, open `settings.py`, comment out the SQLite block, and uncomment the MariaDB block:

```python
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.mysql',
#         'NAME': 'news_app',
#         'USER': 'root',
#         'PASSWORD': 'yourpassword',
#         'HOST': 'localhost',
#         'PORT': '3306',
#     }
# }
```

See [Switching to MariaDB (Production)](#switching-to-mariadb-production) for full instructions.

---

## Apply Migrations

Run the following commands from the `django-news/` directory (where `manage.py` lives):

```bash
python manage.py makemigrations newsapp
python manage.py migrate
```

`migrate` applies all database migrations and — via a `post_migrate` signal — automatically creates the **Reader**, **Journalist**, and **Editor** Django permission groups.

> **After any change to `models.py`**, always run `makemigrations newsapp` before `migrate`.

---

## Create a Superuser

Create an admin account to access the Django admin panel at `/admin/`:

```bash
python manage.py createsuperuser
```

You will be prompted to enter a username, email address, and password. Once created, start the server and log in at `http://localhost:8000/admin/`.

---

## Load Demo Data

To populate the database with sample content for development and testing:

```bash
python manage.py seed_data
```

This creates:
- 4 demo user accounts (see [Demo Accounts](#demo-accounts) below)
- 2 publishers
- 20 approved articles across both publishers
- 2 newsletters

---

## Run the Development Server

```bash
python manage.py runserver 0.0.0.0:8000
```

The application will be available at:

```
http://localhost:8000
```

To stop the server, press `Ctrl + C` in the terminal.

> **Note:** Using `0.0.0.0:8000` makes the server accessible on all network interfaces, which is required in some hosted development environments. For strictly local development you can use `python manage.py runserver` (defaults to `127.0.0.1:8000`).

---

## Switching to MariaDB (Production)

Follow these steps when you are ready to deploy using MariaDB.

### Step 1 — Install MariaDB

**Windows:**

1. Download the installer from [mariadb.org/download](https://mariadb.org/download/).
2. Run the installer and set a root password when prompted.
3. MariaDB runs as a Windows service automatically after installation.

**macOS (Homebrew):**

```bash
brew install mariadb
brew services start mariadb
```

**Linux (Ubuntu / Debian):**

```bash
sudo apt update
sudo apt install mariadb-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo mysql_secure_installation
```

### Step 2 — Create the database

Open the MariaDB shell:

```bash
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE news_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 3 — Install the Python MySQL adapter

```bash
pip install mysqlclient
```

### Step 4 — Update settings.py

In `settings.py`, comment out the SQLite block and uncomment the MariaDB block, filling in your credentials:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'news_app',
        'USER': 'root',
        'PASSWORD': 'yourpassword',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

### Step 5 — Run migrations against MariaDB

```bash
python manage.py migrate
```

---

## Project Structure

```
<repository-name>/              ← cloned repository root (must match repo name)
└── django-news/                ← Django project root (run all commands from here)
    │
    ├── news_project/           ← Django project configuration package
    │   ├── settings.py         ← Database, installed apps, DRF, email, Twitter config
    │   ├── urls.py             ← Root URL routing (mounts newsapp routes)
    │   └── wsgi.py             ← WSGI entry point for production servers
    │
    ├── newsapp/                ← Main Django application
    │   ├── models.py           ← User (custom), Publisher, Article, Newsletter models
    │   ├── views.py            ← API ViewSets + HTML template views
    │   ├── serializers.py      ← DRF serializers for all models
    │   ├── permissions.py      ← Custom DRF permission classes (role-based)
    │   ├── signals.py          ← Group bootstrap, user→group assignment, approval signals
    │   ├── forms.py            ← SignUpForm, ArticleForm, NewsletterForm
    │   ├── admin.py            ← Admin config with bulk approve/unapprove actions
    │   ├── apps.py             ← AppConfig — connects signals on startup
    │   ├── urls.py             ← REST API routes (/api/*)
    │   ├── frontend_urls.py    ← Template-based HTML routes
    │   ├── tests.py            ← 38 unit tests covering all roles and signals
    │   │
    │   ├── templates/newsapp/  ← HTML templates (Django template language)
    │   │   ├── base.html               ← Shared layout with sticky navigation
    │   │   ├── home.html               ← Homepage hero + article card grid
    │   │   ├── signup.html             ← Registration form with role selection
    │   │   ├── login.html              ← Login form
    │   │   ├── article_list.html       ← Full article listing
    │   │   ├── article_detail.html     ← Single article view
    │   │   ├── article_form.html       ← Create / edit article form
    │   │   ├── article_approval.html   ← Editorial approval dashboard
    │   │   ├── newsletter_list.html    ← Newsletter listing with CRUD controls
    │   │   ├── newsletter_form.html    ← Create / edit newsletter form
    │   │   ├── my_feed.html            ← Personalised reader feed
    │   │   └── my_articles.html        ← Journalist article management table
    │   │
    │   └── management/
    │       └── commands/
    │           └── seed_data.py    ← Management command: loads demo data
    │
    ├── manage.py               ← Django management script entry point
    ├── requirements.txt        ← Python package dependencies
    ├── .env.example            ← Template for the .env configuration file
    ├── .env                    ← Your local config (not committed to Git)
    ├── README.md               ← This file
    └── PLANNING.md             ← Project planning document (ER diagram, architecture)
```

---

## Demo Accounts

Run `python manage.py seed_data` to create these accounts (password: `demo1234` for all):

| Username | Password | Email | Role |
|---|---|---|---|
| `reader_demo` | `demo1234` | `reader@demo.com` | Reader |
| `journalist_demo` | `demo1234` | `journalist@demo.com` | Journalist |
| `journalist2_demo` | `demo1234` | `journalist2@demo.com` | Journalist |
| `editor_demo` | `demo1234` | `editor@demo.com` | Editor |

---

## User Roles & Permissions

### Reader
- View approved articles and all newsletters
- Subscribe to publishers and journalists
- Access a personalised "My Feed" of subscribed content
- **Cannot** create, edit, or delete any content

### Journalist
- Create, edit, and delete **their own** articles (new articles start unapproved)
- Create, edit, and delete **their own** newsletters
- View their own unapproved drafts
- **Cannot** approve articles

### Editor
- View, edit, and delete **any** article
- Approve and unapprove articles (triggers email + Twitter notifications)
- View, edit, and delete **any** newsletter
- Access the editorial approval dashboard

### Group Assignment

Users are automatically assigned to the correct Django group on every save via a `post_save` signal. Switching roles (e.g. Reader → Journalist) updates the group assignment immediately and clears Reader-only subscription data.

---

## Article Approval Workflow

1. A **journalist** creates an article — it starts with `approved = False`
2. The article appears in the journalist's "My Articles" dashboard but is hidden from readers
3. An **editor** visits `/articles/approval/` to see all pending articles
4. The editor clicks **Approve** — this sets `approved = True`, records `approved_by` and `approved_at`, and saves the article
5. The `post_save` signal fires two side-effects:
   - **Email** is sent to all readers subscribed to the article's publisher or author
   - **Tweet** is posted to X (Twitter) via the v2 API (if `TWITTER_BEARER_TOKEN` is set)
6. The article is now visible to all readers and appears on the homepage

---

## Django Signals

All signals are registered in `newsapp/signals.py` and connected in `NewsappConfig.ready()`.

| Signal | Sender | Purpose |
|---|---|---|
| `post_migrate` | Any | Creates Reader, Journalist, Editor groups with correct permissions |
| `post_save` | `User` | Assigns the saved user to the Django group matching their role |
| `post_save` | `Article` | On approval: sends subscriber emails + posts to Twitter/X |

### Signal functions (standalone — easy to mock in tests)

```python
send_approval_emails(article)  # Emails all subscribed readers
post_to_twitter(article)       # POSTs to https://api.twitter.com/2/tweets
```

---

## REST API Reference

All API endpoints require token authentication unless marked **Public**.

**Header format:**
```
Authorization: Token <your-token>
```

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | Public | Create account, returns token |
| POST | `/api/auth/login/` | Public | Authenticate, returns token |
| POST | `/api/auth/logout/` | Authenticated | Invalidate current token |

### Articles

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/articles/` | All roles | List articles (role-filtered) |
| POST | `/api/articles/` | Journalist | Create a new article |
| GET | `/api/articles/<id>/` | All roles | Retrieve a single article |
| PUT / PATCH | `/api/articles/<id>/` | Journalist (own) / Editor | Update an article |
| DELETE | `/api/articles/<id>/` | Journalist (own) / Editor | Delete an article |
| GET | `/api/articles/subscribed/` | Reader | Articles from subscribed publishers/journalists |
| POST | `/api/articles/<id>/approve/` | Editor | Approve an article |
| POST | `/api/articles/<id>/unapprove/` | Editor | Retract approval |

**Query parameters (article list):**

| Parameter | Example | Description |
|---|---|---|
| `search` | `?search=django` | Search title, content, or author username |
| `ordering` | `?ordering=-created_at` | Sort by `created_at` or `title` |

### Newsletters

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/newsletters/` | All roles | List all newsletters |
| POST | `/api/newsletters/` | Journalist / Editor | Create a newsletter |
| GET | `/api/newsletters/<id>/` | All roles | Retrieve a newsletter |
| PUT / PATCH | `/api/newsletters/<id>/` | Journalist (own) / Editor | Update a newsletter |
| DELETE | `/api/newsletters/<id>/` | Journalist (own) / Editor | Delete a newsletter |

### Publishers & Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/publishers/` | Authenticated | List all publishers |
| GET | `/api/users/` | Journalist / Editor | List users |

### Example: Register and create an article

```bash
# Register a new journalist account
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "secret123", "role": "journalist"}'

# Response: { "token": "abc123...", "user": { ... } }

# Create an article using the returned token
curl -X POST http://localhost:8000/api/articles/ \
  -H "Authorization: Token abc123..." \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Article", "content": "Article body here."}'
```

---

## Frontend Routes

| URL | Description | Access |
|---|---|---|
| `/` | Homepage — latest 20 approved articles | Public |
| `/signup/` | Account creation with role selection | Public |
| `/login/` | Session login | Public |
| `/logout/` | Session logout (POST) | Authenticated |
| `/articles/` | Full article listing | Public |
| `/articles/new/` | Create article form | Journalist / Editor |
| `/articles/<id>/` | Article detail | Public (unapproved: author/editor only) |
| `/articles/<id>/edit/` | Edit article | Author / Editor |
| `/articles/<id>/delete/` | Delete article (POST) | Author / Editor |
| `/articles/approval/` | Editorial approval dashboard | Editor only |
| `/articles/<id>/approve/` | Approve article (POST) | Editor only |
| `/articles/<id>/unapprove/` | Unapprove article (POST) | Editor only |
| `/newsletters/` | Newsletter listing | Public |
| `/newsletters/new/` | Create newsletter form | Journalist / Editor |
| `/newsletters/<id>/edit/` | Edit newsletter | Author / Editor |
| `/newsletters/<id>/delete/` | Delete newsletter (POST) | Author / Editor |
| `/my-feed/` | Personalised reader feed | Reader only |
| `/subscribe/publisher/<id>/` | Toggle publisher subscription | Reader only |
| `/subscribe/journalist/<id>/` | Toggle journalist subscription | Reader only |
| `/my-articles/` | Article management table | Journalist / Editor |
| `/admin/` | Django admin site | Staff / Superuser |

---

## Running Tests

Run all 38 unit tests from the `django-news/` directory:

```bash
python manage.py test newsapp
```

For verbose output (shows each test name and docstring):

```bash
python manage.py test newsapp --verbosity=2
```

**Test coverage (38 tests):**

| Class | Tests | Coverage |
|---|---|---|
| `AuthenticationTests` | 7 | Login, registration, role-based article visibility |
| `ReaderTests` | 3 | Read-only enforcement, subscribed feed endpoint |
| `JournalistTests` | 6 | Create/edit own articles, cannot edit others, cannot approve |
| `EditorTests` | 7 | Approve/unapprove, full content management, approval template |
| `NewsletterTests` | 5 | Visibility, creation permissions, article association |
| `SignalTests` | 6 | Email dispatch, Twitter posting, failure handling (all mocked) |
| `ModelTests` | 4 | Role properties, subscription clearing, `is_independent` |
