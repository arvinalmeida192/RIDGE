# RIDGE — The Super Simple Codebase Guide

**Read this if:** you opened this project and thought *"what is all of this and where do I even start?"*

**RIDGE** stands for **R**isk **I**ntelligence for **D**ynamic **G**eohazard **E**valuation.  
It is a landslide early-warning system for India's North Eastern Region.

This guide does **not** assume you already know Node.js, Python, or machine learning. We will go slow, use lots of examples, and explain **which file does what** and **why it exists**.

---

## Table of contents

1. [The one-paragraph version](#the-one-paragraph-version)
2. [Think of it like a weather TV station](#think-of-it-like-a-weather-tv-station)
3. [The four programs that run when you do docker compose up](#the-four-programs-that-run-when-you-do-docker-compose-up)
4. [What happens when you open the website](#what-happens-when-you-open-the-website)
5. [The folder structure — explained like folders on your computer](#the-folder-structure--explained-like-folders-on-your-computer)
6. [How the background jobs work (the invisible part)](#how-the-background-jobs-work-the-invisible-part)
7. [Login and users — who can see what](#login-and-users--who-can-see-what)
8. [Every important file, explained with examples](#every-important-file-explained-with-examples)
9. [Real walkthrough examples](#real-walkthrough-examples)
10. [The database — what gets saved where](#the-database--what-gets-saved-where)
11. [Glossary — words you will see in the code](#glossary--words-you-will-see-in-the-code)

---

## The one-paragraph version

RIDGE watches **15 geographic zones** in North East India. Every **15 minutes**, it downloads **rainfall and weather data** from the internet, sends that data to a **Python machine-learning program** that says *"how dangerous is a landslide right now?"*, and if the danger is high enough it **creates an alert**. Then it shows everything on a **website** — one part for **officials** (the operations dashboard) and one part for **regular people** (the citizen portal).

That is the whole project in one sentence:

> **Weather comes in → computer calculates risk → alert if bad → show on a website.**

---

## Think of it like a weather TV station

Imagine a TV weather station. It has:

| Real-world role | RIDGE equivalent | Where it lives in code |
|-----------------|------------------|------------------------|
| The **building** where everything happens | The **server** (Node.js program) | `server/` folder |
| The **weather instruments** that collect data | **Ingestion workers** that call Open-Meteo API | `server/src/workers/` |
| The **meteorologist** who interprets the data | The **ML service** (Python + XGBoost) | `ml-service/` folder |
| The **alarm system** that goes off when things are bad | The **alert engine** | `server/src/services/alertEngine.js` |
| The **TV screens** people look at | The **web pages** (HTML templates) | `server/views/` |
| The **filing cabinet** where records are kept | **PostgreSQL database** | Docker container `ridge-postgres` |
| The **receptionist** who checks IDs at the door | **Authentication** | `server/src/services/authService.js` |

You do not need to understand all of this right now. We will come back to each piece.

---

## The four programs that run when you do `docker compose up`

When you run:

```bash
docker compose up -d --build
```

Docker starts **four separate programs** (called "containers"). They talk to each other over the network.

### 1. `ridge-postgres` — the database

- **What it is:** PostgreSQL with PostGIS (geography support).
- **What it stores:** Users, zones, rainfall readings, risk scores, alerts, everything.
- **You rarely touch it directly.** The server reads and writes to it automatically.
- **Port on your machine:** `5432`

**Example:** When zone `z01` gets a new rainfall reading of `45mm`, that number gets saved in a table called `sensor_readings` inside this database.

---

### 2. `ridge-redis` — fast temporary storage

- **What it is:** Redis, an in-memory cache.
- **What it does right now:** Connected and health-checked. Mostly ready for future features.
- **Port on your machine:** `6379`

**Example:** Think of Redis like sticky notes on a desk — fast to read, but not the permanent filing cabinet. Postgres is the filing cabinet.

---

### 3. `ridge-ml` — the brain that scores risk

- **What it is:** A Python program (FastAPI) that loads a trained XGBoost model.
- **What it does:** You send it weather + terrain numbers, it replies with a risk score (like 3.7 out of 5) and an explanation of *why*.
- **Port on your machine:** `8000`
- **Main file:** `ml-service/src/main.py`

**Example:** The server sends something like:

```json
{
  "zones": [
    {
      "zone_id": "z01",
      "rainfall_1h": 12.5,
      "rainfall_24h": 80.0,
      "soil_saturation": 0.85,
      "slope_angle": 32.0
    }
  ]
}
```

The ML service replies:

```json
{
  "predictions": [
    {
      "zone_id": "z01",
      "risk_score": 4.2,
      "risk_level": "Warning"
    }
  ]
}
```

You can actually try this yourself at http://localhost:8000/docs (Swagger UI).

---

### 4. `ridge-server` — the main app (this is the big one)

- **What it is:** Node.js + Express. This is what you interact with in the browser.
- **What it does:**
  - Serves web pages (HTML)
  - Provides JSON APIs
  - Runs background jobs on a schedule
  - Talks to postgres, redis, and the ML service
- **Port on your machine:** `3002` (mapped to port 3000 inside the container)
- **Starts from:** `server/src/index.js`

**Example:** When you go to http://localhost:3002/dashboard, you are talking to `ridge-server`. It builds the HTML page and sends it back to your browser.

---

### How they connect (simple diagram)

```
YOUR BROWSER
     │
     │  http://localhost:3002
     ▼
┌─────────────┐
│ ridge-server│──────► ridge-postgres  (save/read data)
│  (Node.js)  │
│             │──────► ridge-redis     (cache)
│             │
│             │──────► ridge-ml         (get risk scores)
│  (port 3002)│         (port 8000)
└─────────────┘
```

The file that wires this together for local dev is `docker-compose.yml` at the project root.

---

## What happens when you open the website

Let's trace **exactly** what happens when you type `http://localhost:3002` in your browser.

### Step 1 — Browser sends a request

Your browser says: *"Hey server, give me the homepage."*

That is an HTTP `GET` request to `/`.

### Step 2 — Express receives it

The server program is built in `server/src/app.js`. That file registers all the routes.

The homepage route is defined in `server/src/routes/pages.js`:

```javascript
router.get('/', optionalPageAuth, pages.showLanding)
```

Translation: *"When someone visits `/`, optionally check if they're logged in, then call the function `showLanding`."*

### Step 3 — The controller runs

`showLanding` lives in `server/src/controllers/pagesController.js`.

It does roughly this:

1. Ask the analytics service for stats (how many zones, how many alerts, etc.)
2. Ask what auth mode is active (Firebase or legacy login)
3. Tell the template renderer: *"Render `landing.ejs` inside the `public` layout"*

### Step 4 — EJS builds the HTML

Templates live in `server/views/`.

- `server/views/pages/landing.ejs` — the actual page content (headline, buttons)
- `server/views/layouts/public.ejs` — the wrapper around it (header, footer, CSS link)

The helper `server/src/utils/renderPage.js` stitches them together.

### Step 5 — HTML comes back to your browser

You see the landing page with two buttons:
- **Operations Login** → goes to `/login`
- **Citizen Portal** → goes to `/citizen/login`

### Step 5b — Meanwhile, on the server startup (before you even visit)

When the server first boots (`server/src/index.js`), it does this **in order**:

1. **Wait for database** — keeps retrying until Postgres is ready
2. **Run migrations** — `server/src/db/migrate.js` applies SQL files from `server/src/db/migrations/` to create/update tables
3. **Seed demo data** — `server/src/db/seeds/seed_from_prototype.js` inserts the 15 zones, demo users (`admin`/`user`), sample news
4. **Connect to Redis**
5. **Start the scheduler** — `server/src/scheduler.js` begins the 15-minute background jobs
6. **Run initial ingestion** — immediately fetch weather once so the dashboard isn't empty
7. **Listen on port 3000** (shown as 3002 on your machine)

So by the time you open the browser, data is already flowing in the background.

---

## The folder structure — explained like folders on your computer

Here is the project root. We will go folder by folder.

```
RIDGE/
├── .env                    ← YOUR settings (passwords, API keys, on/off switches)
├── .env.example            ← A template showing what .env should contain
├── docker-compose.yml      ← Tells Docker how to start all 4 programs
├── README.md               ← Quick setup instructions
├── CODEBASE.md             ← This file
├── serviceAccountKey.json  ← Firebase login key (you create this; not in git)
│
├── server/                 ← THE MAIN APP (90% of what you care about)
├── ml-service/             ← THE ML BRAIN (Python)
├── archive/                ← Old React prototype (ignore this)
└── nginx/                  ← Production web proxy (ignore for local dev)
```

---

### The `server/` folder — the main application

This is where most of the code lives. Think of it as the **entire website + background workers + API**.

```
server/
├── src/           ← JavaScript source code (the logic)
├── views/         ← HTML templates (what users see)
├── public/        ← CSS and browser JavaScript (styles, maps, charts)
├── locales/       ← Translations (English + Assamese)
├── tests/         ← Automated tests
└── package.json   ← Lists Node.js dependencies (like a shopping list of libraries)
```

#### `server/src/` — the brain of the server

```
server/src/
├── index.js          ← START HERE. This is the "on" button for the whole server.
├── app.js            ← Builds the Express app (middleware, routes, static files)
├── scheduler.js      ← The alarm clock that runs background jobs every 15 min
│
├── config/           ← Settings readers (database connection, env vars, Firebase)
├── routes/           ← URL → function mappings ("/dashboard" goes here)
├── controllers/      ← Functions that handle requests (thin — they delegate)
├── services/         ← The real business logic (database queries, ML calls, alerts)
├── middleware/       ← Guards that run BEFORE controllers (auth checks, errors)
├── workers/          ← Background jobs (fetch weather, score risk, evaluate alerts)
├── db/               ← Database migrations and seed data
└── utils/            ← Small helper functions (format dates, render pages)
```

**Simple rule of thumb:**

| Folder | Analogy | Example |
|--------|---------|---------|
| `routes/` | Street signs | "`/dashboard` is this way" |
| `controllers/` | Reception desk | Takes the request, passes it along |
| `services/` | The actual workers | Does the real job (query DB, call ML) |
| `middleware/` | Security guard | "Show me your login cookie first" |
| `workers/` | Night shift crew | Runs on a timer, you don't click anything |

---

### The `ml-service/` folder — the machine learning program

```
ml-service/
├── src/
│   ├── main.py       ← FastAPI app (the "on" button for ML)
│   ├── model.py      ← Loads the XGBoost model file and runs predictions
│   ├── features.py   ← Turns raw numbers into the format the model expects
│   ├── forecast.py   ← Predicts risk for the next 24 hours
│   ├── triggers.py   ← Extra rule checks before/after ML
│   └── train.py      ← Retrains the model (you rarely need this locally)
├── models/           ← The actual trained model files (.joblib)
├── data/             ← Training data
└── scripts/          ← Tools to rebuild training data
```

**Important:** The server never runs Python directly. It **calls the ML service over HTTP** like calling another website on your machine.

The file that makes those HTTP calls is `server/src/services/mlService.js`.

---

### The `server/views/` folder — what the website looks like

These are **HTML templates** with placeholders. EJS fills in the placeholders with real data.

```
server/views/
├── layouts/              ← Page shells (sidebar, header, footer)
│   ├── public.ejs        ← Landing page wrapper
│   ├── login.ejs         ← Login page wrapper
│   ├── admin.ejs         ← Operations dashboard wrapper (has sidebar)
│   └── citizen.ejs       ← Citizen portal wrapper (bilingual sidebar)
│
├── pages/                ← Actual page content
│   ├── landing.ejs       ← Homepage
│   ├── dashboard.ejs     ← Operations map + stats
│   ├── login-citizen.ejs ← Citizen login + signup
│   ├── login-operational.ejs ← Ops login (no signup)
│   ├── citizen-home.ejs  ← Citizen dashboard
│   └── ... (more pages)
│
└── partials/             ← Small HTML chunks loaded by HTMX
    ├── alert-feed.ejs    ← Live alert ticker
    └── zone-card.ejs     ← One zone summary card
```

**Example of EJS in action:**

In `dashboard.ejs` you might see:

```html
<div class="stat-value"><%= stats.totalZones %></div>
```

When the page renders, `<%= stats.totalZones %>` becomes `15` (or whatever the real number is). The controller passed `stats` into the template.

---

### The `server/public/` folder — files the browser downloads directly

```
server/public/
├── css/ridge.css              ← All the dark-theme styling
└── js/
    ├── ridge-map.js           ← Leaflet map (colored zone markers)
    ├── ridge-charts.js        ← Chart.js graphs
    ├── ridge-app.js           ← Live alert updates (SSE + HTMX)
    ├── ridge-citizen.js       ← SMS subscribe form handling
    └── ridge-firebase-auth.js ← Google/email login (when Firebase is on)
```

These are **not** processed by the server. The browser downloads them as-is, like any normal website's CSS and JavaScript files.

**Example:** On the dashboard, `ridge-map.js` reads zone data that was embedded in the HTML, puts markers on a Leaflet map, and colors them green/yellow/red based on risk level.

---

## How the background jobs work (the invisible part)

This is the most important thing to understand about RIDGE. **Most of the app runs without anyone clicking anything.**

The file `server/src/scheduler.js` is the **alarm clock**. It uses `node-cron` to run jobs on a schedule.

### The main loop (every 15 minutes)

```
scheduler.js wakes up
        │
        ▼
ingestRainfall.js  ──►  Calls Open-Meteo API for each zone
        │               Saves to sensor_readings table
        ▼
scoreRisk.js  ──►  Reads latest readings from DB
        │          Sends batch to ml-service /predict/batch
        │          Saves scores to risk_scores table
        ▼
evaluateAlerts.js  ──►  Compares scores to thresholds
                       Creates/updates alerts table rows
                       Sends SMS + SSE notifications
```

### What each worker file does (in plain English)

| File | How often | What it does |
|------|-----------|--------------|
| `workers/ingestRainfall.js` | Every 15 min | Downloads current rainfall for all 15 zones from Open-Meteo |
| `workers/ingestForecast.js` | Every hour | Downloads the next 24 hours of rain forecast |
| `workers/ingestHistorical.js` | Daily at 2 AM | Backfills older rainfall data from archives |
| `workers/ingestTerrain.js` | Weekly | Updates slope/elevation numbers for each zone |
| `workers/ingestOsm.js` | Monthly | Downloads nearby roads and villages from OpenStreetMap |
| `workers/ingestGsi.js` | On startup | Loads historical landslide locations from GSI data file |
| `workers/scoreRisk.js` | After rainfall ingest | Asks ML service to score all zones |
| `workers/scoreForecast.js` | After forecast ingest | Asks ML service for 24-hour risk projection |
| `workers/evaluateAlerts.js` | After scoring | Decides if any zone needs an alert |

### Example: what `ingestRainfall.js` actually does

1. Gets the list of active zones from the database (z01 through z15)
2. For each zone, calls `server/src/services/openMeteo.js` which hits `https://api.open-meteo.com/...`
3. Gets back JSON like hourly temperature, rainfall, soil moisture
4. Runs `server/src/services/validateReading.js` to reject impossible values (e.g. rainfall of -500mm)
5. Computes rolling windows (rainfall in last 1h, 6h, 24h, 72h)
6. Inserts a row into `sensor_readings` in Postgres
7. Logs the job run to `ingestion_runs` via `ingestionTracker.js`

You never click anything. This just happens.

### Example: what happens when risk is high

Say zone `z03` gets a risk score of **4.6**.

1. `evaluateAlerts.js` runs
2. It calls `server/src/services/alertEngine.js`
3. `alertEngine.js` uses rules from `server/src/services/alertRules.js`:
   - Score ≥ 4.5 → **Warning** tier
4. A new row is inserted into the `alerts` table
5. `server/src/services/notificationDispatcher.js`:
   - Looks up phone numbers subscribed to z03 in `alert_subscriptions`
   - Sends SMS via MSG91 (or simulates if no API key)
   - Calls `server/src/services/sseHub.js` to push a live update
6. If you have the dashboard open, `ridge-app.js` receives the SSE event and HTMX refreshes the alert feed partial

---

## Login and users — who can see what

RIDGE has **two front doors** and **three types of users**.

### The two front doors

| Door | URL | Can you sign up? |
|------|-----|------------------|
| **Citizen portal** | `/citizen/login` | **Yes** — create account (Firebase or legacy username) |
| **Operations login** | `/login` | **No** — sign in only. You need to be approved first. |

The citizen login page template is `server/views/pages/login-citizen.ejs`.  
The operations login page is `server/views/pages/login-operational.ejs`.

Notice: only the citizen page has a "Create Account" button.

### The three user types

| Role | Who | What they can access |
|------|-----|----------------------|
| `citizen` | Regular person | `/citizen/*` pages only |
| `operator` | Approved official | Operations dashboard (`/dashboard`, `/alerts`, etc.) |
| `admin` | System administrator | Everything + `/admin` console |

Demo accounts (seeded automatically):

| Username | Password | Role |
|----------|----------|------|
| `user` | `user` | citizen |
| `admin` | `admin` | admin |

### How login actually works (legacy mode — the simple one)

**Example: citizen logs in with username `user` and password `user`**

1. Browser submits a form `POST /login` with `username`, `password`, `loginType=citizen`
2. `server/src/routes/pages.js` catches it → calls `pagesController.handleLogin`
3. `handleLogin` calls `authService.loginUser(username, password)` in `server/src/services/authService.js`
4. `loginUser` looks up the user in the `users` table
5. Compares password with `bcrypt.compare()` against `password_hash` in the database
6. If correct, creates a JWT token via `signToken()` in `server/src/middleware/auth.js`
7. Sets a cookie called `ridge_token` on the response (httpOnly — JavaScript can't steal it)
8. Redirects browser to `/citizen`

**Example: new citizen signs up (legacy mode)**

1. User visits `/citizen/login?mode=signup`
2. Fills in username, optional email, password
3. Form submits `POST /citizen/signup`
4. `pagesController.handleCitizenSignup` calls `authService.registerCitizen()`
5. New row inserted into `users` with `role = 'citizen'`
6. Cookie set, redirect to `/citizen`

### How login works (Firebase mode)

1. Browser loads `ridge-firebase-auth.js`
2. User clicks "Continue with Google" or enters email/password
3. Firebase (Google's auth service) verifies them client-side
4. Browser gets a Firebase `idToken`
5. JavaScript sends it to `POST /api/v1/auth/firebase-session`
6. `authController.firebaseSession` calls `authService.authenticateWithFirebase()`
7. Server verifies token with Firebase Admin SDK (`server/src/config/firebase.js`)
8. Creates or links user in database
9. Sets `ridge_token` cookie, redirects to `/citizen` or `/dashboard`

### How a citizen becomes an operator

1. Citizen logs in, goes to `/citizen/access` (page: `citizen-access.ejs`)
2. Submits a reason via `POST /api/v1/auth/request-operational`
3. Row created in `operational_access_requests` with status `pending`
4. Admin logs in, opens `/admin` (page: `admin.ejs`)
5. Admin clicks Approve → `POST /api/v1/auth/access-requests/:id/review`
6. User's role changes to `operator`, `operational_status` becomes `approved`
7. That user can now sign in at `/login` and reach `/dashboard`

### Which files guard pages?

When you try to visit `/dashboard` without permission:

1. `server/src/routes/pages.js` has:
   ```javascript
   router.get('/dashboard', pageAuth, pageRequireOperational, pages.showDashboard)
   ```
2. `pageAuth` (in `server/src/middleware/pageAuth.js`) reads the `ridge_token` cookie
3. If no valid cookie → redirect to `/?next=/dashboard`
4. `pageRequireOperational` checks role is `admin` or `operator` with approved status
5. If citizen → blocked

---

## Every important file, explained with examples

We will go through the **server** file by file. If a file isn't listed here, it is either a test file, a migration SQL file, or something you rarely need to touch.

---

### `server/src/index.js` — THE START BUTTON

**What it does:** This is the first file that runs when the server starts.

**In order, it:**
1. Waits until Postgres answers `SELECT 1`
2. Runs migrations (if `DB_MIGRATE_ON_START=true`)
3. Seeds demo data (if `DB_SEED_ON_START=true`)
4. Connects to Redis
5. Starts the scheduler (background jobs)
6. Runs one initial ingestion so data exists immediately
7. Starts listening for HTTP requests on port 3000

**You edit this when:** Almost never. Unless you want to change startup behavior.

---

### `server/src/app.js` — BUILDS THE WEB SERVER

**What it does:** Creates the Express application and wires everything together.

**Key things it sets up:**
- Security headers (helmet)
- JSON body parsing
- Cookie parsing (reads `ridge_token` from cookies)
- Rate limiting on login endpoints (stops brute-force attacks)
- EJS as the template engine
- Static file serving from `server/public/`
- Mounts all route files:
  - `/` → `routes/pages.js`
  - `/api/v1/auth` → `routes/auth.js`
  - `/api/v1/zones` → `routes/zones.js`
  - etc.
- SSE endpoint at `/api/v1/events/alerts` for live alert streaming

**Example:** When you call `GET /api/v1/zones`, Express looks at the routes registered in `app.js`, finds `zonesRoutes`, and hands off to `zonesController`.

---

### `server/src/scheduler.js` — THE ALARM CLOCK

**What it does:** Registers cron jobs that run workers on a schedule.

**The most important job** (every 15 minutes by default):

```javascript
schedule('rainfall', `*/${env.ingestionIntervalMin} * * * *`, ingestRainfallAndScore)
```

`ingestRainfallAndScore` does three things in sequence:
1. `ingestRainfall()` — fetch weather
2. `scoreRisk()` — call ML
3. `evaluateAlerts()` — check if alerts needed

**You edit this when:** You want to change how often data is fetched, or add a new scheduled job.

---

### `server/src/config/env.js` — READS YOUR `.env` FILE

**What it does:** Loads environment variables and exports them as a JavaScript object.

**Examples of what it reads:**

| `.env` variable | What it controls |
|---------------|-----------------|
| `DATABASE_URL` | Where Postgres lives |
| `ML_SERVICE_URL` | Where the Python ML app lives (`http://ml-service:8000` in Docker) |
| `INGESTION_ENABLED` | `true` = run background jobs; `false` = stop them |
| `FIREBASE_PROJECT_ID` | If set, enables Firebase login |
| `JWT_SECRET` | Secret key used to sign login tokens |

Every other file imports settings from here instead of reading `.env` directly.

---

### `server/src/config/database.js` — POSTGRES CONNECTION

**What it does:** Creates a connection pool to PostgreSQL.

**Used by:** Every service that reads or writes data.

**Example usage in code:**

```javascript
const { rows } = await pool.query('SELECT * FROM zones WHERE id = $1', ['z01'])
```

---

### `server/src/config/firebase.js` — FIREBASE SETUP

**What it does:** Initializes Firebase Admin SDK for verifying Google/email logins.

**If `FIREBASE_PROJECT_ID` is empty:** Firebase is disabled; legacy username/password login is used instead.

---

### `server/src/routes/pages.js` — ALL THE WEB PAGES

**What it does:** Maps URLs to page controller functions.

**Examples:**

| URL | Function | Who can access |
|-----|----------|----------------|
| `GET /` | `showLanding` | Anyone |
| `GET /login` | `showLogin` | Anyone |
| `GET /citizen/login` | `showCitizenLogin` | Anyone |
| `POST /citizen/signup` | `handleCitizenSignup` | Anyone (creates citizen account) |
| `GET /dashboard` | `showDashboard` | Logged-in operator/admin |
| `GET /citizen` | `showCitizen` | Any logged-in user |
| `GET /citizen/access` | `showCitizenAccess` | Any logged-in user |
| `GET /logout` | `handleLogout` | Anyone (clears cookie) |

**You edit this when:** You add a new page to the website.

---

### `server/src/routes/auth.js` — LOGIN API ENDPOINTS

**What it does:** JSON API for authentication (used by JavaScript and mobile apps).

| Endpoint | What it does |
|----------|--------------|
| `GET /api/v1/auth/config` | Returns whether Firebase or legacy login is active |
| `POST /api/v1/auth/signup` | Create a new citizen account (legacy mode) |
| `POST /api/v1/auth/login` | Login with username/password, returns JWT JSON |
| `POST /api/v1/auth/firebase-session` | Exchange Firebase token for session cookie |
| `GET /api/v1/auth/me` | Who am I? (returns current user profile) |
| `POST /api/v1/auth/request-operational` | Citizen applies for ops access |
| `GET /api/v1/auth/access-requests` | Admin lists pending requests |
| `POST /api/v1/auth/access-requests/:id/review` | Admin approves or rejects |

---

### `server/src/controllers/pagesController.js` — RENDERS HTML PAGES

**What it does:** The biggest controller. Each exported function renders one page.

**Example — `showDashboard`:**

1. Calls `analyticsService.getDashboardStats()` → `{ totalZones: 15, activeAlerts: 2, ... }`
2. Calls `zoneService.getAllZones()` → array of 15 zone objects with risk scores
3. Calls `alertService.getAlertFeed(10)` → last 10 alerts
4. Calls `renderPage(res, 'admin', 'pages/dashboard', { title, user, stats, zones, alerts, ... })`
5. Browser receives fully built HTML

**Example — `showCitizen`:**

1. Reads language from URL (`?lang=as`) or cookie (`ridge_lang`)
2. Loads translation strings from `server/locales/en.json` or `as.json`
3. Loads zone data for the selected zone (default `z01`)
4. Renders `citizen-home.ejs` inside `citizen.ejs` layout

---

### `server/src/services/authService.js` — ALL USER LOGIC

**What it does:** Everything related to users and permissions.

**Key functions:**

| Function | What it does |
|----------|--------------|
| `registerCitizen(username, password, email)` | Creates a new citizen user with bcrypt-hashed password |
| `loginUser(username, password)` | Checks password, returns JWT |
| `authenticateWithFirebase(idToken, loginType)` | Verifies Firebase token, creates/links user |
| `requestOperationalAccess(userId, reason)` | Citizen applies for ops dashboard access |
| `reviewAccessRequest(requestId, reviewerId, { approve })` | Admin approves or rejects |
| `getAuthMode()` | Returns `{ firebaseEnabled, legacyLoginEnabled }` |

---

### `server/src/services/zoneService.js` — ZONE DATA

**What it does:** Fetches zone information from the database, usually joined with the latest risk score.

**Used by:** Dashboard map, zone detail page, citizen home page, API `/api/v1/zones`.

**Example:** `getZoneById('z01')` returns something like:

```javascript
{
  id: 'z01',
  name: 'Shillong Ridge',
  state: 'Meghalaya',
  lat: 25.5788,
  lng: 91.8933,
  riskScore: 2.1,
  riskLevel: 'Low',
  rainfall24h: 12.4
}
```

---

### `server/src/services/scoringService.js` — CALLS THE ML MODEL

**What it does:** The bridge between the database and the Python ML service.

**Flow:**
1. Query Postgres for latest sensor readings + terrain attributes for all zones
2. Build feature objects (rainfall windows, soil saturation, slope, etc.)
3. POST to `http://ml-service:8000/predict/batch` via `mlService.js`
4. POST to `/explain` for SHAP factors
5. INSERT results into `risk_scores` and `causative_factors` tables

**This is the file that connects "we have weather data" to "we have a risk number."**

---

### `server/src/services/mlService.js` — HTTP CLIENT TO PYTHON

**What it does:** Thin wrapper that sends HTTP requests to the ML service.

```javascript
// Simplified idea:
const response = await fetch(`${ML_SERVICE_URL}/predict/batch`, {
  method: 'POST',
  body: JSON.stringify({ zones: featureBatch }),
})
```

If the ML service is down, scoring fails and gets logged. The dashboard might show stale scores.

---

### `server/src/services/alertEngine.js` + `alertRules.js` — THE ALARM SYSTEM

**`alertRules.js`** defines the thresholds:

| Tier | Minimum score | Color | Meaning |
|------|---------------|-------|---------|
| Advisory | 2.5 | Yellow | Be aware |
| Watch | 3.5 | Orange | Prepare |
| Warning | 4.5 | Red | Take action |

**`alertEngine.js`** loops through all zones and:
- If score crossed a threshold → create a new alert
- If score got worse → escalate (Advisory → Watch → Warning)
- If score improved → de-escalate or resolve
- Respects cooldown (`ALERT_COOLDOWN_MIN`) so the same zone isn't alerted every 15 minutes

---

### `server/src/services/notificationDispatcher.js` — TELLS PEOPLE

**What it does:** When a new alert is created:
1. Finds subscribed phone numbers for that zone
2. Sends SMS via MSG91 (or logs a fake SMS if no API key)
3. Broadcasts to all open dashboard browsers via SSE
4. Optionally emails authorities

---

### `server/src/services/openMeteo.js` — FETCHES WEATHER

**What it does:** HTTP client for the Open-Meteo API (free weather data, no API key needed).

**Example:** For zone z01 at lat 25.57, lng 91.89, it requests hourly rainfall for the past 72 hours and next 24 hours.

---

### `server/src/middleware/auth.js` — API AUTH GUARD

**What it does:** For JSON API routes, checks the JWT token.

Looks for token in:
1. `Authorization: Bearer <token>` header, OR
2. `ridge_token` cookie

**Example:** `GET /api/v1/auth/me` requires `authenticate` middleware. No token → 401 Unauthorized.

---

### `server/src/middleware/pageAuth.js` — PAGE AUTH GUARD

**What it does:** Same as `auth.js` but for HTML pages. Instead of returning JSON error, it **redirects** to the landing page.

**Example:** Visit `/dashboard` without logging in → redirect to `/?next=/dashboard`.

---

### `server/src/db/migrate.js` + `migrations/*.sql` — DATABASE SETUP

**What it does:** On startup, runs SQL files in order to create/update tables.

| Migration file | What it creates |
|----------------|-----------------|
| `001_initial_schema.sql` | users, zones, sensor_readings, risk_scores, alerts, roads, news, etc. |
| `002_ingestion_tracking.sql` | ingestion_runs, ingestion_state |
| `003_osm_id_length.sql` | Fixes column sizes for OSM IDs |
| `004_alert_subscriptions.sql` | alert_subscriptions (SMS phone numbers) |
| `005_reactivate_manual_resolves.sql` | Data fix for old alerts |
| `006_firebase_auth.sql` | firebase_uid, email columns, operational_access_requests |

**You edit this when:** You need a new database table. Create `007_whatever.sql` and it runs automatically on next startup.

---

### `server/src/db/seeds/seed_from_prototype.js` — DEMO DATA

**What it does:** Inserts the 15 NER zones, demo users, sample news, and initial alerts so the app isn't empty on first run.

**Runs when:** `DB_SEED_ON_START=true` in `.env` (default).

---

### ML service files (Python)

#### `ml-service/src/main.py`

The FastAPI app. Defines HTTP endpoints:

| Endpoint | Input | Output |
|----------|-------|--------|
| `GET /health` | nothing | model loaded? version? metrics? |
| `POST /predict` | one zone's features | one risk score |
| `POST /predict/batch` | many zones' features | many risk scores |
| `POST /explain` | one zone's features | SHAP factors (why this score?) |
| `POST /forecast` | features + hourly rain forecast | 24-hour risk trajectory |
| `POST /train` | training CSV path | retrains model |

#### `ml-service/src/model.py`

Loads `models/xgb_landslide_v1.joblib` and `models/calibrator_v1.joblib` from disk.

When you call predict:
1. Raw features go in
2. XGBoost outputs a probability
3. Isotonic calibrator adjusts the probability
4. Score mapped to 0–5 scale and a level (Low/Advisory/Watch/Warning/Critical)

#### `ml-service/src/features.py`

Turns messy input into the exact column order the model expects. Also computes derived features like "antecedent wetness index."

---

## Real walkthrough examples

These trace **exactly** which files run for common actions.

---

### Example 1: You open the dashboard as admin

```
1. Browser: GET http://localhost:3002/dashboard

2. routes/pages.js
   → pageAuth middleware (reads ridge_token cookie)
   → pageRequireOperational middleware (checks role = admin ✓)
   → pagesController.showDashboard()

3. pagesController.showDashboard()
   → analyticsService.getDashboardStats()
   → zoneService.getAllZones()
   → alertService.getAlertFeed(10)
   → newsService.getNewsItems()
   → zoneService.getMapData()
   → renderPage('admin', 'pages/dashboard', data)

4. renderPage.js
   → Renders views/pages/dashboard.ejs
   → Wraps in views/layouts/admin.ejs
   → Sends HTML to browser

5. Browser downloads:
   → /css/ridge.css
   → /js/ridge-map.js      (draws Leaflet map)
   → /js/ridge-charts.js   (draws charts)
   → /js/ridge-app.js      (opens SSE connection)

6. ridge-app.js connects to GET /api/v1/events/alerts
   → sseHub.js adds this browser to the live listener list
```

---

### Example 2: Background job runs (you don't click anything)

```
1. scheduler.js cron fires (every 15 min)

2. ingestRainfall.js
   → zoneService.getAllZones()           [get zone lat/lng list]
   → openMeteo.fetchHourly(lat, lng)     [HTTP to open-meteo.com]
   → validateReading.js                  [reject bad values]
   → pool.query INSERT sensor_readings   [save to postgres]

3. scoreRisk.js
   → scoringService.scoreAllZones()
      → pool.query SELECT latest readings [read from postgres]
      → mlService.predictBatch()        [HTTP to ml-service:8000]
      → pool.query INSERT risk_scores     [save scores]

4. evaluateAlerts.js
   → alertEngine.evaluateAlerts()
      → alertRules.getTierForScore(4.2)  → "Warning"
      → pool.query INSERT alerts          [new alert row]
      → notificationDispatcher.dispatch()
         → MSG91 SMS (or simulated)
         → sseHub.broadcast('alert', data)
```

---

### Example 3: Citizen subscribes to SMS alerts

```
1. Citizen logged in, visits /citizen/subscribe
   → pagesController.showCitizenSubscribe()
   → Renders citizen-subscribe.ejs with zone list

2. Citizen enters phone number, clicks Subscribe
   → ridge-citizen.js intercepts form
   → POST /api/v1/citizen/subscribe { zoneId: 'z01', phone: '+91...' }

3. routes/citizen.js
   → authenticate middleware (must be logged in)
   → citizenController.subscribe()

4. citizenController.subscribe()
   → Validates phone format
   → INSERT into alert_subscriptions table

5. Later, when z01 gets a Warning alert:
   → notificationDispatcher reads alert_subscriptions for z01
   → Sends SMS to that phone number
```

---

### Example 4: Admin approves ops access

```
1. Admin visits /admin
   → pagesController.showAdmin()
   → authService.listAccessRequests({ status: 'pending' })
   → Renders admin.ejs with pending requests table

2. Admin clicks "Approve" on a request
   → Alpine.js in admin.ejs calls:
   → POST /api/v1/auth/access-requests/abc-123-uuid/review { approve: true }

3. authController.reviewRequest()
   → authService.reviewAccessRequest()
      → UPDATE operational_access_requests SET status = 'approved'
      → UPDATE users SET role = 'operator', operational_status = 'approved'
      → setFirebaseCustomClaims() if Firebase user

4. That citizen can now log in at /login and reach /dashboard
```

---

## The database — what gets saved where

Think of the database as a spreadsheet with many tabs (tables).

### Users and auth

| Table | What's in it | Example row |
|-------|--------------|-------------|
| `users` | Login accounts | username: `user`, role: `citizen` |
| `operational_access_requests` | Citizens asking for ops access | status: `pending`, reason: "District officer" |

### Geography and terrain

| Table | What's in it | Example row |
|-------|--------------|-------------|
| `zones` | The 15 monitored areas | id: `z01`, name: `Shillong Ridge`, state: `Meghalaya` |
| `zone_static_attributes` | Slope, elevation, soil type | zone_id: `z01`, slope_angle: 32.5 |
| `roads` | OSM roads near zones | name: `NH-6`, distance from zone center |
| `settlements` | Villages near zones | name: `Mawphlang`, population estimate |

### Live data (changes every 15 minutes)

| Table | What's in it | Example row |
|-------|--------------|-------------|
| `sensor_readings` | Weather readings per zone per time | rainfall_1h: 12.5mm, soil_saturation: 0.82 |
| `weather_forecasts` | Upcoming rain predictions | hour: `2026-09-01T15:00`, precipitation: 8.2mm |
| `risk_scores` | ML output per scoring run | risk_score: 3.8, risk_level: `Watch` |
| `risk_forecasts` | 24-hour projected risk | hour_offset: 6, projected_score: 4.1 |
| `causative_factors` | SHAP explanation per score | feature: `rainfall_24h`, importance: 0.34 |

### Alerts and notifications

| Table | What's in it | Example row |
|-------|--------------|-------------|
| `alerts` | Active and past alerts | tier: `Warning`, zone_id: `z03`, state: `active` |
| `alert_subscriptions` | Phone numbers for SMS | phone: `+919876543210`, zone_id: `z01` |
| `notification_log` | Record of sent SMS/emails | channel: `sms`, status: `sent` |

### System

| Table | What's in it | Example row |
|-------|--------------|-------------|
| `system_health` | Is each component OK? | component: `ml-service`, status: `healthy` |
| `ingestion_runs` | Log of each background job | job: `rainfall`, status: `success`, duration_ms: 4200 |
| `news_items` | Advisories shown on dashboard | title: `Heavy rain expected in Meghalaya` |

---

## Glossary — words you will see in the code

| Word | Simple meaning |
|------|----------------|
| **Express** | A Node.js library for building web servers |
| **EJS** | Embedded JavaScript — HTML templates with `<%= variables %>` |
| **HTMX** | Lets you update parts of a page without reloading the whole thing |
| **JWT** | JSON Web Token — a signed string that proves you're logged in |
| **Middleware** | Code that runs *before* your main handler (like a security check) |
| **Controller** | Function that handles one HTTP request |
| **Service** | Function that does real work (database, API calls) |
| **Worker** | Background job that runs on a timer |
| **Cron** | A schedule format for "run this every X minutes" |
| **PostGIS** | Postgres extension for storing map coordinates |
| **GeoJSON** | JSON format for map shapes (points, polygons) |
| **SSE** | Server-Sent Events — server pushes live updates to the browser |
| **SHAP** | ML technique that explains *which inputs* caused a prediction |
| **XGBoost** | A popular machine learning algorithm (gradient boosted trees) |
| **FastAPI** | Python library for building HTTP APIs (like Express but for Python) |
| **Seed** | Insert starter/demo data into an empty database |
| **Migration** | SQL script that creates or changes database tables |
| **Docker Compose** | Tool to start multiple programs (containers) with one command |
| **Legacy login** | Username + password stored in our own database |
| **Firebase** | Google's authentication service (Google sign-in, email/password) |

---

## Quick reference: "I want to change X, which file do I edit?"

| I want to... | Edit this file |
|--------------|----------------|
| Change the homepage text | `server/views/pages/landing.ejs` |
| Change colors/styling | `server/public/css/ridge.css` |
| Add a new web page | `server/src/routes/pages.js` + `server/src/controllers/pagesController.js` + new `.ejs` in `server/views/pages/` |
| Change how often weather is fetched | `.env` → `INGESTION_INTERVAL_MIN` or `server/src/scheduler.js` |
| Change alert thresholds | `server/src/services/alertRules.js` |
| Change demo login users | `server/src/db/seeds/prototypeData.js` |
| Add a new database table | New file in `server/src/db/migrations/` |
| Change citizen portal translations | `server/locales/en.json` or `as.json` |
| Change how risk is calculated | `ml-service/src/model.py` or `features.py` |
| Change what data is sent to ML | `server/src/services/scoringService.js` |
| Add a new API endpoint | New route in `server/src/routes/` + controller + service |
| Change login behavior | `server/src/services/authService.js` |
| Change the citizen signup form | `server/views/pages/login-citizen.ejs` |
| Change map behavior | `server/public/js/ridge-map.js` |
| Change live alert updates | `server/public/js/ridge-app.js` + `server/src/services/sseHub.js` |
| Turn off background jobs | `.env` → `INGESTION_ENABLED=false` |
| Turn off ML scoring | `.env` → `SCORING_ENABLED=false` |
| Turn off alerts | `.env` → `ALERTS_ENABLED=false` |

---

## What to ignore

| Path | Why you can ignore it |
|------|----------------------|
| `archive/prototype-react/` | Old React UI, not used |
| `nginx/` | Only for production deployment |
| `docker-compose.prod.yml` | Production Docker config |
| `server/node_modules/` | Downloaded libraries, don't edit |
| `ml-service/.venv/` | Python virtual environment |
| `.git/` | Git version control metadata |

---

## Summary — the whole app in 10 lines

1. **Docker** starts postgres, redis, ml-service, and server.
2. **Server boots** (`index.js`), sets up database, seeds demo data, starts scheduler.
3. **Every 15 minutes**, workers fetch weather, score risk with ML, evaluate alerts.
4. **Alerts** trigger SMS and live dashboard updates.
5. **You open the browser** → Express routes your URL to a controller.
6. **Controller** fetches data from services (which query Postgres).
7. **EJS template** turns data into HTML.
8. **Browser JavaScript** draws maps, charts, and listens for live alerts.
9. **Citizens** sign up at `/citizen/login` and use the citizen portal.
10. **Officials** sign in at `/login` (after approval) and use the operations dashboard.

That is the entire RIDGE codebase. Start with `server/src/index.js` when reading code, and follow the imports from there.

---

*Developed by Los Gatos*
