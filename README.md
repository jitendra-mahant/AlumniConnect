# AlumniConnect

A college-specific professional networking platform that connects **current students with verified alumni**.
It is not a generic social network. The goal is a structured, trusted alumni database that students can search for
career guidance, mentorship, internships, jobs, referrals, and community Q&A.

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Lucide icons |
| Backend | Node.js, Express, REST API |
| Database | MongoDB + Mongoose (12 collections, proper references) |
| Auth & Security | JWT, bcrypt password hashing, role-based authorization (student / alumni / admin), Helmet headers, rate limiting, NoSQL sanitization, safe URL scheme validation |
| DSA | Trie, hash map, priority queue, BFS graph – JS in `backend/dsa/`, C++ in `cpp/` |

```
alumniconnect/
├── frontend/   React 18 + Vite + Tailwind responsive SPA
├── backend/    Express API (models, controllers, routes, middleware, config, dsa, seed, scripts)
├── cpp/        C++ data-structure modules (trie, hash map, BFS, priority queue)
├── README.md
└── .gitignore
```

---

## 1. Prerequisites

- **Node.js 18+** (tested on Node 20 & 24)
- **MongoDB** – one of:
  - a local MongoDB Community install, **or**
  - a free MongoDB Atlas cluster, **or**
  - nothing: use the built-in embedded dev database (see *Quick start*).
- (optional) `g++` / MinGW / Clang to build the C++ modules

## 2. Quick start (no MongoDB install needed)

```bash
# from the project root
npm run install:all          # installs root, backend and frontend dependencies
npm run dev:memory           # embedded MongoDB + seed data + API (5000) + web app (5173)
```

Open **http://localhost:5173**.

`dev:memory` uses `mongodb-memory-server`. Data is stored in `backend/.mongo-data/` (git-ignored) so it survives restarts, and the database is seeded automatically when empty. The embedded MongoDB listens on `mongodb://127.0.0.1:27018`.

## 3. Running with your own MongoDB

### Option A – Local MongoDB
1. Install MongoDB Community Server and start it (default port 27017).
2. Create the env file:
   ```bash
   cd backend
   cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
   ```
3. Keep `MONGODB_URI=mongodb://127.0.0.1:27017/alumniconnect` and set a strong `JWT_SECRET`.

### Option B – MongoDB Atlas
1. Create a free cluster at <https://cloud.mongodb.com>, add a database user, and allow your IP under *Network Access*.
2. Click **Connect → Drivers** and copy the connection string.
3. Put it in `backend/.env`, adding the database name:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/alumniconnect?retryWrites=true&w=majority
   ```

### Then
```bash
npm run seed       # loads sample data (WARNING: wipes the app's collections first)
npm run dev        # API on :5000 + web app on :5173
```

Generate a strong secret with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

> `.env` files are git-ignored. Only the safe `.env.example` file is committed.

## 4. Environment variables (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/alumniconnect` | MongoDB connection string |
| `JWT_SECRET` | – (**required in production**; crypto fallback in dev) | Signs JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin(s), comma separated |
| `COLLEGE_NAME` | `National Institute of Technology` | College name applied to new profiles |

Frontend (`frontend/.env`, optional): `VITE_API_URL` – API origin for production builds. In development Vite proxies `/api` to `localhost:5000`.

## 5. Security Architecture & Hardening

- **Strict Production Gate:** In production (`NODE_ENV=production`), the server immediately halts startup if `JWT_SECRET` is unset, default, or fewer than 32 characters. In development, a cryptographically strong random secret is generated on the fly.
- **Role-Based Access Control (RBAC):** Middleware checks `student`, `alumni`, and `admin` roles on all protected routes. Self-registration as admin is blocked.
- **Insecure Direct Object Reference (IDOR) Protection:** `assertOwnerOrAdmin` verifies record authorship before allowing edits or deletions.
- **XSS & Protocol Validation:** Strict URL scheme verification (`isSafeUrl`) ensures links (`linkedinUrl`, `githubUrl`, `resumeUrl`, `profilePhoto`) only use `http:` or `https:`, blocking `javascript:` or payload injection.
- **NoSQL Injection Defense:** `express-mongo-sanitize` strips out `$` and `.` operators from request bodies, parameters, and query strings.
- **Rate Limiting:** `express-rate-limit` throttles authentication endpoints (`/api/auth/*`) to prevent brute-force attacks and limits general API burst traffic.
- **HTTP Security Headers:** `helmet` sets strict CSP, HSTS, frameguard, and referer policies.
- **Safe Data Masking:** Alumni contact details (email/phone) remain masked to students until an official connection request is accepted.

## 6. Demo accounts (from seed data)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@alumniconnect.edu` | `Admin@123` |
| Student | `student1@alumniconnect.edu` (also `student2`, `student3`) | `Password@123` |
| Alumni (verified) | `priya.sharma@alumniconnect.edu`, `neha.kulkarni@alumniconnect.edu`, `arjun.reddy@alumniconnect.edu` … | `Password@123` |
| Alumni (pending review) | `ishaan.gupta@alumniconnect.edu`, `tanvi.patil@alumniconnect.edu` | `Password@123` |
| Alumni (rejected) | `manish.tiwari@alumniconnect.edu` | `Password@123` |

The seed creates 3 students, 15 alumni (12 verified), 8 jobs/internships, community Q&A threads, connections, mentorship and referral requests, messages, notifications, and reports.

## 7. Features by role

### 🎓 Student
- Register & create academic student profile.
- Discover alumni via faceted search and **Personalized Recommendations** scored by department, skill overlap, and mentorship availability.
- View verified alumni profiles with masked contact info.
- Send connection requests and visualize degrees of separation via BFS graph.
- Request 1-on-1 mentorship and job referrals with tracking.
- Ask questions on the **Alumni Q&A Forum**, accept answers, upvote helpful insights, and reply in follow-up comment threads.
- Browse jobs & internships ranked via Priority Queue matching student skills.
- Save opportunities and communicate via direct messaging.

### 💼 Alumni
- Register & create professional profile (education, current role, previous experience, skills, portfolio links).
- Configure mentorship and referral availability flags and topic areas.
- Post jobs and internships with specific skill requirements.
- Accept or decline incoming connection, mentorship, and referral requests.
- Answer student questions on the **Alumni Q&A Forum** (verified alumni only).
- Chat directly with connected students.

### 🛡️ Admin
- Platform analytics dashboard (users, verified alumni, active jobs, Q&A activity).
- Review and verify pending alumni profiles with approve/reject workflows and feedback notes.
- Moderate the **Alumni Q&A Forum** (hide abusive questions/answers, review user reports).
- User management (suspend, activate, delete accounts).
- Trigger on-demand DSA in-memory index rebuild (`POST /api/admin/reindex`).

---

## 8. API Overview

All routes are mounted under `/api`. Public endpoints: `/auth/register`, `/auth/login`, `/health`, `/public/stats`. All others require `Authorization: Bearer <token>`.

| Area | Endpoints | Description |
|---|---|---|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | JWT authentication and profile retrieval |
| **Alumni** | `GET /alumni`, `GET /alumni/search`, `GET /alumni/:id`, `GET /alumni/recommendations`, `GET /alumni/suggest?q=`, `GET /alumni/filters`, `POST/PUT /alumni/profile` | Directory, scoring recommendations, Trie autocomplete |
| **Q&A Forum** | `GET /qa/questions`, `POST /qa/questions`, `GET /qa/questions/:id`, `PUT/DELETE /qa/questions/:id`, `POST /qa/questions/:id/answers`, `PUT/DELETE /qa/answers/:id`, `POST /qa/answers/:id/upvote`, `POST /qa/answers/:id/comments`, `PUT /qa/answers/:id/accept`, `PUT /qa/moderate` | Complete Q&A platform with verified alumni answers, upvoting, comments & moderation |
| **Students** | `GET /students/profile`, `POST /students/profile`, `PUT /students/profile` | Student profile management |
| **Connections** | `POST /connections`, `GET /connections`, `PUT /connections/:id`, `GET /connections/path/:userId` | Connection management & BFS shortest path |
| **Mentorship** | `POST /mentorship`, `GET /mentorship`, `PUT /mentorship/:id` | Mentorship requests & response workflows |
| **Referrals** | `POST /referrals`, `GET /referrals`, `PUT /referrals/:id` | Referral requests & response workflows |
| **Jobs** | `POST /jobs`, `GET /jobs`, `GET /jobs/:id`, `PUT/DELETE /jobs/:id`, `POST /jobs/:id/save`, `GET /jobs/saved` | Job board with priority-queue student ranking |
| **Messages** | `POST /messages`, `GET /messages/conversations`, `GET /messages/:userId` | Direct messaging between connected users |
| **Notifications** | `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/read-all`, `PUT /notifications/:id/read` | Real-time event notifications |
| **Admin** | `GET /admin/stats`, `GET /admin/users`, `PUT/DELETE /admin/users/:id`, `GET /admin/alumni`, `PUT /admin/alumni/:id/verify`, `GET /admin/jobs`, `GET /admin/reports`, `PUT /admin/reports/:id`, `POST /admin/reindex` | Administration, verification, moderation & index rebuild |
| **Misc** | `POST /reports`, `GET /public/stats`, `GET /health` | Abuse reporting, public landing stats, health check |

---

## 9. Data Structures & Algorithms (DSA)

| DSA | Feature & Purpose | Node.js Implementation | C++ Standalone Module |
|---|---|---|---|
| **Trie** | Prefix search & instant autocomplete for skills, companies, job titles, and domains | `backend/dsa/Trie.js` | `cpp/search/trie.cpp` |
| **Hash Map** | Inverted skill index mapping skills to alumni IDs for $O(1)$ lookup | `backend/dsa/SkillIndex.js` | `cpp/search/skill_hashmap.cpp` |
| **Priority Queue (Max-Heap)** | Multi-factor job ranking scoring skill overlap, interest alignment, freshness, and urgency | `backend/dsa/PriorityQueue.js`, `jobRanking.js` | `cpp/ranking/job_ranking.cpp` |
| **Graph & BFS** | Connection network modeling degrees of separation and shortest path between users | `backend/dsa/graph.js` | `cpp/graph/connection_bfs.cpp` |

The runtime API uses high-performance JavaScript DSA modules with automatic 15-second TTL cache invalidation. Standalone, compiled C++ modules verify the identical algorithmic logic.

### Building & Running C++ Modules:
```powershell
# Windows PowerShell
cd cpp
powershell -ExecutionPolicy Bypass -File build.ps1
```
```bash
# Linux / macOS
cd cpp
make test
```

---

## 10. Testing & Verification

Run the end-to-end automated smoke test suite (covering auth, security, directory search, recommendations, Q&A workflows, connections, BFS graph hops, mentorship, job ranking, and admin moderation):

```bash
# In backend/ directory:
npm run test:smoke
```

All 35+ test scenarios run against a clean database instance and verify complete endpoint contract compliance.

To verify frontend compilation:
```bash
# In frontend/ directory:
npm run build
```

---

## 11. Production Deployment

1. Set `NODE_ENV=production`.
2. Generate and set a high-entropy `JWT_SECRET` (minimum 32 characters).
3. Provide your production MongoDB connection string in `MONGODB_URI`.
4. Set `CLIENT_URL` to your production frontend domain (e.g., `https://alumni.yourcollege.edu`).
5. Build the frontend: `cd frontend && npm run build`. The output in `frontend/dist` can be served via Nginx, Vercel, Netlify, or AWS S3/CloudFront.
6. Run the Node.js API behind PM2 or a container runtime (Docker / Kubernetes).
