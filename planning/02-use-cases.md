# Use Case Descriptions
## The Press Room — News Portal Platform

---

## UC-01: Approve an Article

**Actor:** Editor  
**Goal:** Review a pending article submission and publish or reject it.

**Preconditions:**
- The editor is authenticated with a valid JWT
- At least one article exists with `approved = false`

**Postconditions:**
- The article's `approved` field is updated to `true` or remains `false`
- If approved, the article appears in the public article listing

**Main Flow:**
1. Editor navigates to the Dashboard
2. System fetches the list of pending articles from `GET /api/articles/pending`
3. Editor reads the article title and content
4. Editor clicks "Approve"
5. System sends `PATCH /api/articles/:id/approve` with `{ "approved": true }`
6. System updates the article record in the database
7. System logs the approval action
8. System returns the updated article object
9. Dashboard refreshes the pending queue (article no longer appears)

**Alternative Flow — Rejection:**
- At step 4, the editor clicks "Reject" instead
- Step 5 sends `{ "approved": false }` (article remains unapproved)
- Article stays in the pending queue for revision

**Exceptions:**
- If the article ID does not exist → system returns 404
- If the requester is not an editor → system returns 403
- If the JWT is missing or expired → system returns 401

---

## UC-02: Create a Newsletter

**Actor:** Journalist  
**Goal:** Curate a collection of approved articles into a named newsletter.

**Preconditions:**
- The journalist is authenticated with a valid JWT
- At least one approved article exists to link

**Postconditions:**
- A new newsletter record is created in the database
- The newsletter is linked to the specified articles via the newsletter_articles join table
- The newsletter appears in `GET /api/newsletters`

**Main Flow:**
1. Journalist navigates to the "New Newsletter" page
2. Journalist enters a title and description
3. Journalist selects one or more articles to include (by article ID)
4. Journalist clicks "Create Newsletter"
5. System sends `POST /api/newsletters` with title, description, and articleIds
6. System inserts the newsletter record
7. System inserts rows into newsletter_articles for each selected article ID
8. System returns the full newsletter object including enriched article details
9. Journalist is redirected to the newsletter detail page

**Alternative Flow — No Articles Selected:**
- At step 3, journalist skips article selection
- Newsletter is created with an empty article list
- Articles can be added later via `PATCH /api/newsletters/:id`

**Exceptions:**
- If title or description is missing → system returns 400 with validation error
- If the requester is not a journalist → system returns 403
- If the JWT is missing or expired → system returns 401

---

## UC-03: Subscribe to a Publisher

**Actor:** Reader  
**Goal:** Follow a publisher so their articles appear in the reader's personalised feed.

**Preconditions:**
- The reader is authenticated with a valid JWT
- The target publisher exists

**Postconditions:**
- A row is inserted into reader_publisher_subscriptions (if not already present)
- The publisher's articles appear in the reader's `GET /api/articles/subscribed` feed

**Main Flow:**
1. Reader navigates to the Publishers page
2. Reader clicks on a publisher to view its detail page
3. Reader clicks "Follow"
4. System sends `POST /api/subscriptions/publishers/:publisherId`
5. System checks whether the subscription already exists
6. If not, system inserts the subscription record
7. System returns `{ subscribed: true }`
8. Follow button changes to "Unfollow"

**Alternative Flow — Already Subscribed:**
- At step 5, the subscription already exists
- System skips the insert (idempotent)
- System still returns `{ subscribed: true }` — no error

**Alternative Flow — Unsubscribe:**
- Reader clicks "Unfollow" on a publisher they already follow
- System sends `DELETE /api/subscriptions/publishers/:publisherId`
- Subscription row is removed
- System returns `{ subscribed: false }`

**Exceptions:**
- If the publisher ID is not a valid integer → system returns 400
- If the requester is not a reader → system returns 403
- If the JWT is missing or expired → system returns 401

---

## UC-04: View Subscribed Articles Feed

**Actor:** Reader  
**Goal:** See a personalised feed of approved articles from followed publishers and journalists.

**Preconditions:**
- The reader is authenticated
- The reader has at least one active subscription (publisher or journalist)

**Postconditions:**
- The reader sees a chronological list of approved articles from their subscriptions

**Main Flow:**
1. Reader navigates to their Dashboard
2. System sends `GET /api/articles/subscribed` with the reader's JWT
3. Server fetches the reader's publisher subscription IDs
4. Server fetches the reader's journalist subscription IDs
5. Server queries for approved articles matching either source (OR condition)
6. Server returns articles sorted newest-first, limited to 50
7. Dashboard renders the personalised feed

**Alternative Flow — No Subscriptions:**
- At step 3 and 4, both lists are empty
- System returns an empty array immediately
- Dashboard shows "Follow publishers or journalists to see your feed"

**Exceptions:**
- If the JWT is missing or expired → system returns 401
- If the database query fails → global error handler returns 500

---

## UC-05: API Client Retrieves Articles

**Actor:** Any client (authenticated or anonymous)  
**Goal:** Retrieve a filtered, paginated list of published articles.

**Preconditions:**
- The API server is running
- At least one approved article exists

**Postconditions:**
- Client receives a JSON object containing an `items` array and a `total` count

**Main Flow:**
1. Client sends `GET /api/articles` with optional query parameters:
   - `search` — case-insensitive title substring match
   - `publisherId` — filter by publisher
   - `authorId` — filter by author
   - `limit` — number of results (default 20)
   - `offset` — pagination offset (default 0)
2. Server validates query parameters against the Zod schema
3. Server builds a dynamic WHERE clause from the provided filters
4. Server executes count and data queries in parallel
5. Server enriches each article with author username and publisher name
6. Server returns `{ items: [...], total: N }`

**Alternative Flow — No Matching Results:**
- WHERE clause matches zero rows
- Server returns `{ items: [], total: 0 }`

**Exceptions:**
- If a query parameter has an invalid type (e.g. `publisherId=abc`) → 400 validation error
- If the database is unreachable → 500 via global error handler
