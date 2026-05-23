# User Interface Wireframes
## The Press Room — News Portal Platform

> These are text-based wireframes describing the layout and key elements
> of each page. Actual UI is built with React + Tailwind CSS + shadcn/ui.

---

## 1. Article List Page (`/articles`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVBAR: [The Press Room]  Articles  Newsletters  Publishers  [Sign In] [Get Started]
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Articles                                                           │
│  Browse all published, editor-approved articles.                    │
│                                                                     │
│  ┌────────────────────────────────────────┐ ┌──────────┐ ┌───────────────────┐
│  │  🔍  Search articles...               │ │  Search  │ │ All publishers ▾  │
│  └────────────────────────────────────────┘ └──────────┘ └───────────────────┘
│                                                                     │
│  6 articles found                                                   │
│                                                                     │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  │ [PUBLISHER LABEL]    │ │                      │ │ [PUBLISHER LABEL]    │
│  │                      │ │                      │ │                      │
│  │ Article Title Here   │ │ Article Title Here   │ │ Article Title Here   │
│  │                      │ │                      │ │                      │
│  │ Excerpt of article   │ │ Excerpt of article   │ │ Excerpt of article   │
│  │ content goes here... │ │ content goes here... │ │ content goes here... │
│  │                      │ │                      │ │                      │
│  │ author · 🕐 2 hrs ago│ │ author · 🕐 1 day ago│ │ author · 🕐 3 days   │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘
│                                                                     │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  │  ...                 │ │  ...                 │ │  ...                 │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Search input + Search button
- Publisher filter dropdown
- Article cards in a 3-column responsive grid
- Each card: publisher label (coloured), title, excerpt, author, relative timestamp
- Clicking a card navigates to Article Detail

---

## 2. Article Approval Page (Editor Dashboard)

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVBAR: [The Press Room]  Articles  Newsletters  Publishers  alice_editor ▾
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Dashboard                       ┌──────────────────────────────┐  │
│                                  │ EDITOR VIEW                  │  │
│  ┌─────────────────────────────┐ └──────────────────────────────┘  │
│  │ Pending Review (2)          │                                    │
│  ├─────────────────────────────┤                                    │
│  │ The Quantum Computing Race  │                                    │
│  │ by cara_fields              │                                    │
│  │ In-depth technology...      │  ← excerpt                        │
│  │ Submitted: 2 mins ago       │                                    │
│  │                             │                                    │
│  │  [Read Full Article]  ✓ Approve  ✗ Reject                       │
│  ├─────────────────────────────┤                                    │
│  │ Loneliness in Cities        │                                    │
│  │ by ben_reporter             │                                    │
│  │ Urban loneliness has...     │                                    │
│  │ Submitted: 10 mins ago      │                                    │
│  │                             │                                    │
│  │  [Read Full Article]  ✓ Approve  ✗ Reject                       │
│  └─────────────────────────────┘                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Pending count badge in section header
- Each pending article: title, author, excerpt, submission time
- "Read Full Article" link opens article detail in new tab
- Green Approve button, red Reject button
- After action: card disappears from queue (optimistic update)

---

## 3. Newsletter Creation Page (`/newsletters/new`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVBAR: [The Press Room]  Articles  Newsletters  Publishers  ben_reporter ▾
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Create Newsletter                                                  │
│                                                                     │
│  Title *                                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Tech Frontiers: AI & Robotics                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Description *                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Weekly deep dives into the technologies reshaping the world │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Add Articles                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  🔍  Search your approved articles...                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Available:                          Selected (2):                  │
│  ☐ AI Chip Startup Raises $2.4B  →  ✓ Inside the Scramble...      │
│  ☐ Climate Summit Reaches...        ✓ AI Chip Startup Raises...    │
│  ☐ Future of Democracy...                                           │
│                                                                     │
│                       ┌──────────────────────┐                     │
│                       │   Create Newsletter  │                     │
│                       └──────────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Title and description inputs (both required)
- Article search/filter input
- Checkable list of available articles
- Selected articles shown in a separate column
- Submit button disabled until title + description provided

---

## 4. Reader Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVBAR: [The Press Room]  Articles  Newsletters  Publishers  dan_reader ▾
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Dashboard                                                          │
│  Welcome back, dan_reader                                           │
│                                                                     │
│  ┌────────────────────────────────┐  ┌──────────────────────────┐  │
│  │  MY FEED                       │  │  FOLLOWING               │  │
│  │  From publishers & journalists │  │                          │  │
│  │  you follow                    │  │  Publishers (1)          │  │
│  │                                │  │  ┌────────────────────┐  │  │
│  │  (empty state when no subs)    │  │  │ The Daily Record   │  │  │
│  │                                │  │  │ [Unfollow]         │  │  │
│  │  Article Title                 │  │  └────────────────────┘  │  │
│  │  by journalist · 2 hrs ago     │  │                          │  │
│  │                                │  │  Journalists (1)         │  │
│  │  Article Title                 │  │  ┌────────────────────┐  │  │
│  │  by journalist · 1 day ago     │  │  │ ben_reporter       │  │  │
│  │                                │  │  │ [Unfollow]         │  │  │
│  │  [View all articles →]         │  │  └────────────────────┘  │  │
│  └────────────────────────────────┘  └──────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Personalised article feed from subscriptions
- Sidebar showing followed publishers and journalists
- Unfollow buttons on each subscription
- Empty state message prompting user to browse publishers/journalists

---

## 5. Login / Registration Pages

```
LOGIN (/login)                          REGISTER (/register)
──────────────────────────────          ──────────────────────────────
┌──────────────────────────┐            ┌──────────────────────────┐
│                          │            │                          │
│    [The Press Room]      │            │    [The Press Room]      │
│                          │            │                          │
│  Sign In                 │            │  Create Account          │
│                          │            │                          │
│  Email                   │            │  Username                │
│  ┌──────────────────┐    │            │  ┌──────────────────┐    │
│  │                  │    │            │  │                  │    │
│  └──────────────────┘    │            │  └──────────────────┘    │
│                          │            │                          │
│  Password                │            │  Email                   │
│  ┌──────────────────┐    │            │  ┌──────────────────┐    │
│  │                  │    │            │  │                  │    │
│  └──────────────────┘    │            │  └──────────────────┘    │
│                          │            │                          │
│  ┌──────────────────┐    │            │  Password                │
│  │    Sign In       │    │            │  ┌──────────────────┐    │
│  └──────────────────┘    │            │  │                  │    │
│                          │            │  └──────────────────┘    │
│  Don't have an account?  │            │                          │
│  [Get Started →]         │            │  I am a:                 │
│                          │            │  ○ Reader                │
└──────────────────────────┘            │  ○ Journalist            │
                                        │  ○ Editor                │
                                        │                          │
                                        │  ┌──────────────────┐    │
                                        │  │  Create Account  │    │
                                        │  └──────────────────┘    │
                                        │                          │
                                        │  Already registered?     │
                                        │  [Sign In →]             │
                                        └──────────────────────────┘
```

**Key Elements (Login):**
- Email and password fields
- Sign In button
- Link to registration page
- Inline error message on failed login

**Key Elements (Register):**
- Username, email, password fields
- Role selection (radio buttons: Reader / Journalist / Editor)
- Create Account button
- Link back to login
- Inline field-level validation errors
