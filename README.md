# AlumniConnect — KKWAGH Alumni & Student Network

AlumniConnect is a high-performance, college-specific professional networking and career mentorship platform engineered specifically for **K.K. Wagh Institute of Engineering Education & Research (KKWAGH)**.

Unlike generic social networks, AlumniConnect delivers a verified, trusted, and privacy-protected directory linking current students, verified alumni, academic project guides, and college placement administrators.

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons |
| **Backend** | Node.js, Express.js REST API, Socket.io Real-Time Engine |
| **Database** | MongoDB + Mongoose (12 collections, optimized indexing) |
| **Authentication** | JWT, bcrypt password hashing, institutional domain enforcement (`@kkwagh.edu.in`) |
| **Security & Privacy** | Strict phone number redaction, role-based authorization (RBAC), Helmet security headers, rate limiting, NoSQL sanitization |
| **Data Structures** | Trie (prefix autocomplete), Inverted Hash Map (skill search), Max-Heap Priority Queue (job matching), BFS Graph (degrees of separation) |

---

## 🚀 Complete Website Operation & Demonstration Guide

### 1. Starting Services (Exact Commands)

You can run the entire platform with either a local MongoDB service or the zero-dependency embedded database.

#### Option A: One-Command Startup (Concurrent Dev Mode)
If your local MongoDB service is running on default port `27017`:
```powershell
# Open terminal in project root:
cd "C:\Users\Asus\OneDrive\Desktop\PBL\MINI PROJECT\alumniconnect"
npm run dev
```
*Runs backend API on `http://localhost:5000` and Vite frontend on `http://localhost:5173` concurrently.*

#### Option B: Standalone Startup (Two Separate Terminals)
**Terminal 1 — Backend API:**
```powershell
cd "C:\Users\Asus\OneDrive\Desktop\PBL\MINI PROJECT\alumniconnect\backend"
npm run dev
```

**Terminal 2 — Frontend Application:**
```powershell
cd "C:\Users\Asus\OneDrive\Desktop\PBL\MINI PROJECT\alumniconnect\frontend"
npm run dev
```

#### Option C: Zero-Config Embedded Database (No MongoDB Install Needed)
```powershell
cd "C:\Users\Asus\OneDrive\Desktop\PBL\MINI PROJECT\alumniconnect"
npm run dev:memory
```
*Spawns an isolated `mongodb-memory-server` on `127.0.0.1:27018` with persistent local disk storage in `backend/.mongo-data/`.*

---

### 2. Services, Ports, and Browser URLs

| Service | Port | Local URL | Description |
|---|---|---|---|
| **Web Application (Frontend)** | `5173` | [http://localhost:5173](http://localhost:5173) | Responsive React SPA with modern typography & dark/light mode |
| **REST API Server (Backend)** | `5000` | [http://localhost:5000](http://localhost:5000) | Express API & Socket.io WebSockets |
| **API Health Check** | `5000` | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Health status, database connection, and uptime |
| **Public Stats Endpoint** | `5000` | [http://localhost:5000/api/public/stats](http://localhost:5000/api/public/stats) | Landing page aggregate stats (alumni, companies, jobs) |
| **MongoDB (Default)** | `27017` | `mongodb://127.0.0.1:27017/db_alumini_years` | Primary local database |

---

### 3. Verified Pre-Configured Demo Accounts

For evaluation and rapid testing, all 4 platform roles have pre-verified demo credentials that automatically bootstrap on server start:

| Role | Email | Password | What to Expect / Key Features |
|---|---|---|---|
| **Student** | `student@kkwagh.edu.in` | `name@123` | • Browse alumni directory with Trie autocomplete & company filters<br>• Request mentorship & referrals<br>• Explore job board with Priority Queue match ranking<br>• Post Q&A questions and view degree of separation |
| **Alumni (Verified)** | `alumni@kkwagh.edu.in` | `name@123` | • Post jobs & internships<br>• Answer questions in Community Q&A forum with verified badge<br>• Review and accept incoming student connection & mentorship requests<br>• Manage professional profile & mentorship settings |
| **Project Guide / Teacher** | `guide@kkwagh.edu.in` | `name@123` | • Access Teacher Dashboard (`/teacher/dashboard`)<br>• Oversee student project groups, milestones, and deliverables<br>• Provide academic feedback and track student progress<br>• Coordinate with verified alumni for technical mentorship |
| **Administrator** | `admin@kkwagh.edu.in` | `name@123` | • Access Admin Analytics Dashboard (`/admin`)<br>• Verify or reject pending alumni profiles<br>• User management (activate/suspend/delete)<br>• Review abuse reports & trigger DSA in-memory cache rebuild |

> **Convenience Feature:** On the Login page (`/login`), click any role badge under **Quick Demo Accounts** (Student, Alumni, Teacher / Guide, Administrator) to autofill credentials safely into the input fields without automatically submitting the form.

---

### 4. Password Visibility Toggle

The password field across login and registration forms includes an integrated visibility control:
1. **Default State:** Passwords are completely masked (`type="password"`) for safety.
2. **Toggle Button:** Click the eye / eye-off button on the right side of the password field, or focus on it using keyboard navigation (`Tab`) and press `Space` / `Enter`.
3. **Cursor Preservation:** Toggling visibility does not reset cursor position or clear existing text.
4. **Accessible UI:** Includes full screen-reader announcements (`aria-label="Show password"` / `"Hide password"`, `aria-pressed`).
5. **Theme Support:** High-contrast slate icons render clearly in both light mode and dark mode.
6. **Zero Plaintext Leakage:** Plaintext passwords are never logged to console, stored in browser storage, or exposed beyond normal HTTPS payload.

---

### 5. Theme Switching and Typography Selection

AlumniConnect features a high-contrast design system compliant with WCAG AA guidelines:
- **Theme Toggle:** Click the Sun / Moon icon in the navigation bar to switch between Light Mode and Dark Mode instantly.
- **Font Selection:** Open the settings dropdown in the navigation bar to choose your preferred typography:
  - **Inter** (Default — Clean, legible modern sans-serif)
  - **Plus Jakarta Sans** (Refined geometric display typeface)
  - **System UI** (Native OS typography: Segoe UI / San Francisco)
  - **Editorial Serif** (Georgia / Merriweather serif style)
- **Automatic Contrast:** All cards, borders, modal dialogs, badges, and heading tags ("Welcome back", "Directory", "Dashboard") maintain high contrast in both themes.

---

### 6. Recommended Demonstration Paths

#### A. Student Journey
1. Click **Student** on the `/login` demo bar and sign in.
2. Visit **Alumni Directory**: Type in the search box to test instant Trie autocomplete (e.g., search "Google", "React", or "Amazon").
3. Filter by Batch or Company, and click **Connect** to open a connection request modal.
4. Visit **Jobs & Internships**: View algorithmically ranked recommendations scored by skill overlap with your profile.
5. Visit **Q&A Forum**: Post a question to ask alumni about interview preparation.

#### B. Alumni Journey
1. Click **Alumni** on `/login` and sign in.
2. View incoming connection and mentorship requests on the **Requests** tab; click Accept or Decline.
3. Visit **Post a Job**: Create a new internship posting with desired skills.
4. Visit **Q&A Forum**: Post an answer to a student question; notice the verified "Alumni" badge next to your answer.

#### C. Teacher / Project Guide Journey
1. Click **Teacher / Guide** on `/login` and sign in.
2. Navigate to **Teacher Dashboard** (`/teacher/dashboard`).
3. View active student project groups, milestones completed, pending reviews, and guidance requests.
4. Review submitted project progress and assign evaluation comments.

#### D. Administrator Journey
1. Click **Administrator** on `/login` and sign in.
2. Navigate to the **Admin Dashboard** (`/admin`).
3. Inspect platform analytics: registered students, verified alumni, active jobs, and system health.
4. Review pending alumni verification requests with single-click approval or rejection with notes.
5. Inspect user management table and run an on-demand DSA in-memory cache rebuild.

---

### 7. Email and Real-Time Notifications

- **Real-Time WebSockets:** Powered by `Socket.io`. Instant notifications appear for connection requests, mentorship responses, and new answers without refreshing the page.
- **Email Delivery (Mock / Preview Mode):** In development, when `SMTP_USER` is unconfigured, notification emails are logged cleanly to the backend terminal with recipient, subject, and preview URL, avoiding spam or configuration hurdles.
- **Live SMTP Configuration:** To enable live email dispatch, configure standard SMTP credentials in `backend/.env`:
  ```ini
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=your-address@kkwagh.edu.in
  SMTP_PASS=your-google-app-password
  EMAIL_FROM="AlumniConnect KKWAGH <no-reply@kkwagh.edu.in>"
  APP_BASE_URL=http://localhost:5173
  ```

---

## 📧 Manual Email Verification Testing Guide

Follow this step-by-step procedure to manually test and verify the complete email verification and password reset workflows.

### Step A — Prepare the Email Sender
1. **Provider**: The application uses **Nodemailer** with standard SMTP.
2. **Gmail SMTP Setup**:
   - Log in to your Google Account (e.g., your official or test Google account).
   - Navigate to **Google Account Settings → Security**.
   - Under *How you sign in to Google*, ensure **2-Step Verification** is turned ON.
   - Search for **App passwords** (or go to <https://myaccount.google.com/apppasswords>).
   - Select App: **Mail**, Device: **Other (Custom name)**, type `AlumniConnect`, and click **Generate**.
   - Google will show a 16-character code (e.g. `abcd efgh ijkl mnop`). Copy this password.
3. **Configure Environment File**:
   - In `backend/`, create or open `.env` (never commit this file to git):
     ```ini
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=your-account@kkwagh.edu.in
     SMTP_PASS=your-16-char-app-password
     EMAIL_FROM="AlumniConnect KKWAGH <no-reply@kkwagh.edu.in>"
     APP_BASE_URL=http://localhost:5173
     ```
   - Keep credentials private and never expose them in client-side code.
4. **Restart Backend**:
   - Restart the backend terminal so the new environment variables take effect.

### Step B — Start the Application
1. Ensure MongoDB service is running (or use `npm run dev:memory`).
2. Open PowerShell in the project root:
   ```powershell
   cd "C:\Users\Asus\OneDrive\Desktop\PBL\MINI PROJECT\alumniconnect"
   npm run dev
   ```
3. Confirm the backend starts on `http://localhost:5000` and reports:
   `[server] AlumniConnect API and Real-Time Server running on http://localhost:5000`
4. Confirm frontend is accessible at `http://localhost:5173/`.
5. **Port 5000 Conflict Resolution**: If `EADDRINUSE` occurs, run:
   ```powershell
   netstat -ano | findstr :5000
   taskkill /F /PID <PID>
   ```

### Step C — Register a Test Account
1. Open [http://localhost:5173/register](http://localhost:5173/register) in your browser.
2. Select your role (**Student** or **Alumnus**).
3. Enter your full name.
4. Enter an institutional email address that forwards to your controlled inbox (e.g., `test.verify@kkwagh.edu.in`).
5. Choose a password (at least 6 characters).
6. Click **Create account**.
7. Confirm that the UI displays the **"Check your email"** confirmation card with the registered email.
8. Inspect the backend console logs. Notice that raw tokens and passwords are never printed.

### Step D — Check Email Delivery
1. Open your controlled email inbox.
2. Check your **Inbox**, **Spam**, and **Promotions/Junk** folders.
3. Confirm the incoming message:
   - **Sender**: `AlumniConnect KKWAGH <no-reply@kkwagh.edu.in>`
   - **Subject**: `Verify your AlumniConnect KKWAGH account`
   - **Body**: Branded card in standard Arial font with a **"Verify Email Address"** button and full fallback URL.
4. **Dev Fallback Check**: If real SMTP was not configured, the complete email preview with active verification URL is logged directly to the backend terminal under `[DEV EMAIL PREVIEW]`.

### Step E — Verify the Account
1. Click the verification link in the email (or copy the URL `http://localhost:5173/verify-email?token=...` into your browser).
2. The verification screen will display: **"Verifying your KKWAGH email..."** followed by **"Email Verified!"**.
3. Click **Continue to Dashboard** to enter the application with your active session.
4. **Attempt Re-use**: Click the verification link a second time. Confirm that the application rejects re-use with:
   `This link is invalid or has already been used.`
5. **Test Login Policy**:
   - Prior to verification, attempting to log in yields: `Your institutional email address has not been verified yet (HTTP 403 UNVERIFIED_EMAIL)`.
   - After verification, login succeeds immediately with a JWT token and loads your profile.

### Step F — Test Failure Cases
1. **Invalid Token**: Visit `http://localhost:5173/verify-email?token=invalid_tampered_token_123`.
   - *Expected*: Error card stating `This link is invalid or has already been used.`
2. **Expired Token**: Tokens older than 24 hours (or 1 hour for password reset) are automatically rejected with:
   `This verification link has expired. Please request a new one.`
3. **Resend Rate Limiting**: On the verification or login screen, click **Resend Verification Email**.
   - Clicking within 2 minutes displays a countdown cooldown (`Please wait 115 seconds before requesting another verification email`).
4. **Password Reset Flow**:
   - Open `/forgot-password`, enter your email, click **Send Reset Link**.
   - Check inbox for `Reset your AlumniConnect KKWAGH password`.
   - Open `/reset-password?token=...`, type your new password, and submit.
   - Confirm login works with the new password and fails with the old password.

### Step G — Manual Email Test Verification Table

| Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|
| **SMTP Connection** | Transporter initializes with host & port | Transporter verified via `testSmtpConnection()` | **PASS** |
| **Registration** | Account created with `isVerified: false` | User saved in MongoDB with SHA-256 token hash | **PASS** |
| **Email Sending** | Provider accepts email for dispatch | Handled by nodemailer `sendMail()` or Dev Preview | **PASS** |
| **Inbox Delivery** | Message arrives in recipient inbox | Successfully delivered or captured in controlled preview | **PASS** |
| **Valid Verification Link** | Account verified and activated | Transitions `isVerified: true`, clears token hash | **PASS** |
| **Invalid Token** | Verification safely rejected | Returns HTTP 400 `INVALID_TOKEN` with clear UI error | **PASS** |
| **Expired Token** | Expired token rejected | Returns HTTP 400 `EXPIRED_TOKEN` with resend prompt | **PASS** |
| **Reused Token** | Second use rejected | Token hash cleared upon use; reuse returns `INVALID_TOKEN` | **PASS** |
| **Resend Rate Limit** | Cooldown enforced between sends | HTTP 429 returned if triggered within 120s cooldown | **PASS** |
| **Login After Verification** | Verified login succeeds; unverified blocked | Unverified blocked with 403; verified logs in with JWT | **PASS** |
| **Password Reset** | Secure reset link updates password | Valid token resets password; reuse rejected | **PASS** |

---

### 8. Troubleshooting Common Setup Errors

#### Issue 1: PowerShell Script Execution Policy (`UnauthorizedAccess`)
**Symptom:** `npm : File ... npm.ps1 cannot be loaded because running scripts is disabled on this system.`
**Resolution:** Open PowerShell as Administrator or run in current user scope:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

#### Issue 2: Port Conflict — `EADDRINUSE: address already in use :::5000`
**Symptom:** Backend fails to start because port `5000` is already held by a previous Node.js instance.
**Resolution:**
```powershell
# Identify process using port 5000:
netstat -ano | findstr :5000
# Terminate the PID (replace <PID> with the actual process ID):
taskkill /F /PID <PID>
```
*Or simply run:* `Stop-Process -Name node -Force` *to clear orphaned background node processes.*

#### Issue 3: Port 5173 In Use — Vite Starts on 5174
**Symptom:** `Port 5173 is in use, trying another one... Local: http://localhost:5174/`
**Resolution:** Terminate the process holding `5173`:
```powershell
netstat -ano | findstr :5173
taskkill /F /PID <PID>
```
The frontend is pre-configured with proxy rules to forward all `/api` requests to `http://localhost:5000` regardless of the frontend port.

#### Issue 4: `ECONNREFUSED` / Database Connection Error
**Symptom:** `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`
**Resolution:**
1. Check if MongoDB Community Service is running:
   ```powershell
   Get-Service -Name MongoDB
   Start-Service -Name MongoDB
   ```
2. Or run without local MongoDB using embedded in-memory mode:
   ```powershell
   npm run dev:memory
   ```

---

## 🔒 Security Architecture & Privacy Enforcement

- **Strict Student & Alumni Privacy:** Secondary and mobile phone numbers are strictly prohibited across all data ingestion pipelines, database schemas, and API serializations. Student and alumni contact details are never exposed to unauthenticated or unverified users.
- **Institutional Domain Verification:** Registration enforces the college's official email domain (`@kkwagh.edu.in`) using RFC 5322 compliant regex validation.
- **Insecure Direct Object Reference (IDOR) Defense:** All mutation endpoints enforce ownership verification (`assertOwnerOrAdmin`) prior to profile, job, or request updates.
- **NoSQL Injection & Sanitization:** `express-mongo-sanitize` actively strips recursive `$` and `.` MongoDB query operators from all incoming requests.
- **Safe Protocol Enforcement:** Links (LinkedIn, GitHub, portfolio URLs) are validated against an allowlist (`http:`, `https:`) via `isSafeUrl`, mitigating `javascript:` or pseudo-protocol XSS vectors.
- **Rate Limiting & Security Headers:** `express-rate-limit` mitigates credential stuffing on `/api/auth/*`, while `helmet` enforces strict CSP, HSTS, frame-guard, and X-Content-Type options.

---

## 🧩 Data Structures & Algorithmic Modules (DSA)

| DSA Component | Purpose | Backend Implementation | C++ Standalone Verification |
|---|---|---|---|
| **Trie** | Instant prefix-matching autocomplete for companies, skills, roles, and names | `backend/dsa/Trie.js` | `cpp/search/trie.cpp` |
| **Inverted Hash Map** | $O(1)$ skill index mapping competencies directly to verified alumni IDs | `backend/dsa/SkillIndex.js` | `cpp/search/skill_hashmap.cpp` |
| **Max-Heap Priority Queue** | Job and internship ranking by computing skill overlap, freshness, and urgency | `backend/dsa/PriorityQueue.js` | `cpp/ranking/job_ranking.cpp` |
| **BFS Graph** | Shortest path and degrees of separation between students and alumni | `backend/dsa/graph.js` | `cpp/graph/connection_bfs.cpp` |

---

## 🧪 Automated Testing & Verification

Run the test suites from the project root:

```powershell
# 1. Verify Frontend Production Build (Vite + Tailwind)
npm run build --prefix frontend

# 2. Verify Duplicate Email Registration & Normalization Flow
node backend/scripts/testDuplicateRegistrationFlow.js

# 3. Verify Email Verification, Password Reset & Feature Audits
node backend/scripts/testEmailAndFeatureAudit.js

# 4. Verify Authentication, Password Security & Demo Accounts
node backend/scripts/testAuthAndDemoAccounts.js

# 5. Verify Alumni Data Import & Strict Privacy Enforcement
node backend/scripts/test2022ImportAndPrivacy.js

# 6. Verify Real-Time WebSockets Engine
node backend/scripts/testRealtime.js

# 7. Full End-to-End API Smoke Test Suite
npm run test:smoke --prefix backend
```

---

## 📋 Project Directory Structure

```
alumniconnect/
├── frontend/                     # React 18 + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/           # Navbar, Footer, Modals, Cards, RequestList
│   │   ├── context/              # AuthContext, ThemeContext, SocketContext
│   │   ├── pages/                # AuthPages, Directory, Q&A, TeacherDashboard, Profile
│   │   └── utils/                # Theme, API client, formatting
│   └── vite.config.js            # Proxy configuration (:5000)
├── backend/                      # Express.js REST API
│   ├── config/                   # Database, bootstrap seeding, institutional settings
│   ├── controllers/              # Auth, Alumni, Teacher, Jobs, Q&A, Requests
│   ├── dsa/                      # Trie, Hash Map, Priority Queue, Graph BFS
│   ├── middleware/               # Auth (JWT), RBAC, Error handling, Sanitization
│   ├── models/                   # Mongoose schemas (User, Alumni, Student, Project, etc.)
│   ├── routes/                   # Modular API route definitions
│   └── scripts/                  # Automated verification and test suites
└── cpp/                          # Standalone C++ verification modules
```
