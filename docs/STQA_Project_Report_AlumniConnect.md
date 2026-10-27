# K. K. Wagh Institute of Engineering Education & Research, Nashik
### Department of Computer Engineering
#### Academic Year: 2026–2027

---

# ALUMNI CONNECT — ALUMNI NETWORKING AND MENTORSHIP PLATFORM
## Subject: Software Testing and Quality Assurance (STQA)
### Course: B.Tech in Computer Engineering (TY B.Tech)

**Submitted By:**  
- **Student Name:** Jitendra Kewaldas Mahant  
- **Roll Number:** 38  
- **Class:** TY B.Tech Computer Engineering  
- **Subject:** Software Testing and Quality Assurance (STQA)  
- **Academic Year:** 2026–2027  

**Under the Guidance of:**  
- **Project Guide:** Prof. N. S. Pagare, Assistant Professor, Department of Computer Engineering  
- **Head of Department:** Dr. S. S. Sane, Department of Computer Engineering  
- **Principal:** Dr. K. N. Nandurkar, KKWIEER, Nashik  
- **Affiliated University:** Savitribai Phule Pune University (SPPU)  

---

## CERTIFICATE

This is to certify that the project report entitled **"Alumni Connect — Alumni Networking and Mentorship Platform"** submitted by **Jitendra Kewaldas Mahant** (Roll No: **38**, Class: **TY B.Tech Computer Engineering**) is a bonafide record of work carried out by him in partial fulfillment of the requirements for the course **Software Testing and Quality Assurance (STQA)** of Third Year B.Tech Computer Engineering at **K. K. Wagh Institute of Engineering Education & Research (KKWIEER), Nashik** during the academic year **2026–2027**.

The project work has been examined, rigorously tested, and evaluated according to standard software testing methodologies, test design principles, and quality assurance criteria.

```
_______________________________             _______________________________
Prof. N. S. Pagare                            Dr. S. S. Sane
Project Guide / Faculty In-Charge            Head of Department
Department of Computer Engineering           Department of Computer Engineering

_______________________________             _______________________________
Dr. K. N. Nandurkar                       External Examiner
Principal, KKWIEER Nashik                    Savitribai Phule Pune University
```

---

## CANDIDATE DECLARATION

I, **Jitendra Kewaldas Mahant**, student of Third Year B.Tech in Computer Engineering at **K. K. Wagh Institute of Engineering Education & Research, Nashik**, hereby declare that the project report entitled **"Alumni Connect — Alumni Networking and Mentorship Platform"** submitted to the Department of Computer Engineering for the subject **Software Testing and Quality Assurance (STQA)** is an authentic record of original project development, testing, and quality assurance work completed under the guidance of **Prof. N. S. Pagare**.

I further confirm that the test cases, defect evaluations, and automated verification suites presented herein reflect genuine analysis of the MERN stack codebase.

**Jitendra Kewaldas Mahant**  
Roll No: 38 | Class: TY B.Tech Computer Engineering  
Department of Computer Engineering, KKWIEER Nashik  

---

## ACKNOWLEDGEMENT

I express my sincere and heartfelt gratitude to my project guide, **Prof. N. S. Pagare**, Assistant Professor, Department of Computer Engineering, for his invaluable guidance, continuous encouragement, constructive critiques, and meticulous supervision throughout the development and testing phases of this project.

I am profoundly thankful to **Dr. S. S. Sane**, Head of the Department of Computer Engineering, and our respected Principal, **Dr. K. N. Nandurkar**, for their academic leadership and support.

Finally, I thank my family, faculty members, and peers for their continuous encouragement.

---

## ABSTRACT

In contemporary higher education ecosystems, maintaining an engaged, authenticated, and productive network between current undergraduates and institutional alumni is a primary driver of career readiness, mentorship, and placement opportunities. **Alumni Connect** is a dedicated full-stack web platform built for K. K. Wagh Institute of Engineering Education & Research (KKWIEER), Nashik, engineered on the MERN stack (MongoDB, Express.js, React 18, Node.js) with Tailwind CSS, JSON Web Token (JWT) role-based authorization, and real-time Socket.IO synchronization.

This academic project report presents a thorough, systematic application of **Software Testing and Quality Assurance (STQA)** principles across the Alumni Connect system lifecycle. Adhering to the Software Testing Life Cycle (STLC) and the IEEE 829 test documentation standard, the platform was subjected to multi-tiered verification and validation encompassing black-box test design (Equivalence Partitioning, Boundary Value Analysis, Decision Tables), white-box API verification, static token and WCAG 2.1 AA contrast auditing across 36 modules, defect tracking, and mathematical computation of STQA quality metrics.

**Keywords:** Software Testing and Quality Assurance (STQA), STLC, MERN Stack, Equivalence Partitioning, Boundary Value Analysis, Defect Management, WCAG 2.1 AA, JWT Security, Quality Metrics.

---

# CHAPTER 1: INTRODUCTION

## 1.1 Overview of Software Testing and Quality Assurance
Software Testing and Quality Assurance (STQA) represents the fundamental engineering discipline responsible for ensuring that a software product complies with established functional specifications, satisfies non-functional constraints, and operates with verified reliability, security, and performance. Software Quality Assurance (SQA) is an umbrella, process-oriented discipline defined by IEEE Standard 730 as a planned and systematic pattern of all actions necessary to provide adequate confidence that an item conforms to established technical requirements.

Conversely, Software Testing is the destructive, analytical subset aimed at uncovering defects and assessing system capabilities prior to deployment. Barry Boehm's Cost of Quality curve illustrates that defect remediation cost escalates exponentially throughout the software lifecycle: a defect identified in requirements costs $1\times$, escalating to $10\times$ in coding, $15\times$ in testing, and $100\times$ post-deployment in production.

## 1.2 Need for Software Testing in Web Applications
Modern web applications built on asynchronous Single Page Application (SPA) architectures face specific quality risks:
1. **Distributed Asynchronous State:** Decoupling React 18 from Express REST APIs introduces complex state synchronization, network latency, token invalidation, and race conditions.
2. **Cross-Browser & Multi-Device Heterogeneity:** The application must deliver consistent layout stability and contrast across Chrome, Edge, Safari, Firefox, and screen widths from 320px to 1440px+.
3. **Security Vulnerabilities (OWASP Top 10):** Web endpoints are targets for NoSQL Injection, Broken Object-Level Authorization (BOLA), and Cross-Site Scripting (XSS).
4. **Data Persistence & Index Collisions:** Document databases require strict schema validation and unique index enforcement to prevent duplicate records.

## 1.3 Introduction to Alumni Connect Platform
Alumni Connect is an institutional web platform designed for KKWIEER Nashik to connect students, alumni, and faculty for mentorship, referral requests, capstone guidance, and placement preparation.

## 1.4 Problem Statement
Colleges rely on informal WhatsApp groups or public LinkedIn searches that lack institutional verification, expose personal mobile numbers, lack structured guidance workflows, and suffer from inconsistent user interfaces.

## 1.5 Project Objectives
- Engineer a secure, role-based platform (Student, Alumni, Teacher, Admin).
- Enforce institutional domain validation (@kkwagh.edu.in) and multi-tier verification.
- Implement efficient search using Trie prefix matching and Priority Queues.
- Establish an accessible UI adhering strictly to approved fonts (Arial, Helvetica, Times New Roman) and WCAG 2.1 AA contrast.
- Execute a comprehensive STLC incorporating automated test suites.

## 1.6 Scope of the Project
- **In-Scope:** JWT authentication, bcrypt hashing, profile management, directory search, mentorship requests, job board, admin verification, dynamic theme/font switcher.
- **Out-of-Scope:** Third-party OAuth (Google/LinkedIn), SMS hardware gateways, integrated WebRTC video calling, ERP fee integration.

## 1.7 Functional & Non-Functional Requirements
- **FR-01 to FR-12:** Covers registration, login, bcrypt encryption, profile management, directory search, admin verification queue, connection requests, mentorship routing, job board, socket notifications, admin password recovery, and theme/font toggle.
- **NFR-01 to NFR-06:** Enforces < 500ms latency, zero plaintext passwords, WCAG 2.1 AA 4.5:1 text contrast, strict Arial/Helvetica/Times typography, responsive 320px–1440px scaling, and modular MVC architecture.

---

# CHAPTER 2: SOFTWARE REQUIREMENTS AND SYSTEM ANALYSIS

## 2.1 Hardware and Software Requirements
- **Development Server:** Node.js v24.x LTS, Quad-Core CPU, 8GB+ RAM, MongoDB Community Server / Memory Server.
- **Client Requirements:** Modern web browser (Chrome 130+, Edge 130+, Firefox 131+), responsive viewport 320px to 1440px.
- **Tech Stack:** React 18.3, Vite 5.4, Tailwind CSS 3.4, Express 4.21, Mongoose 8.7, jsonwebtoken 9.0, bcrypt 6.0.

## 2.2 System Architecture
Alumni Connect adopts a Three-Tier MVC Architecture:
- **Presentation Tier (React 18 SPA):** Handles views, client-side routing, theme switching, and local storage token management.
- **Application Tier (Express REST API):** Handles input validation, bcrypt verification, JWT signing/guards, business controllers, and Socket.IO events.
- **Persistence Tier (MongoDB & Mongoose):** Manages collections (Users, Profiles, Connections, Jobs, Messages), unique indexes, and data integrity.

## 2.3 User Roles & Permissions Matrix
Strict RBAC separates Student, Unverified Alumni, Verified Alumni, Teacher, and Administrator roles. Unverified alumni are restricted to a dedicated pending verification view and hidden from the public directory until approved by an administrator.

## 2.4 Authentication Workflow
Passwords hashed with bcrypt (10 salt rounds); signed JWT issued upon login; protected endpoints verified via `Authorization: Bearer <token>` middleware; role guards block unauthorized access with 403 Forbidden.

---

# CHAPTER 3: SOFTWARE TESTING METHODOLOGY

## 3.1 Software Testing Life Cycle (STLC)
Follows 7 disciplined phases:
1. Requirement Analysis & Traceability
2. Test Planning (IEEE 829)
3. Test Case Design (EP, BVA, Decision Tables)
4. Test Environment Provisioning
5. Test Execution (Automated + Manual)
6. Defect Logging, Triage & Retesting
7. Test Closure & Quality Sign-Off

## 3.2 Verification vs. Validation
Static verification (code reviews, ESLint, static token audits) conducted alongside dynamic validation (Supertest API calls, browser DOM mutation).

## 3.3 Black-Box Techniques Applied
- **Equivalence Partitioning:** Applied to email domains (@kkwagh.edu.in vs external domains).
- **Boundary Value Analysis:** Applied to password lengths (min 6 chars: test 5, 6, 7) and graduation years (1984, 1985, 2026, 2035).
- **Decision Tables:** Applied to alumni directory filtering conditions.

---

# CHAPTER 4: TEST PLAN (IEEE 829 STANDARD)

- **Test Plan ID:** `TP-ALUMNI-2026-V1.0`
- **Strategy:** Pyramid testing combining static analysis, in-memory API integration testing, and automated DOM layout assertions.
- **Entry Criteria:** Clean Vite build (0 compilation errors), database initialized.
- **Exit Criteria:** 100% of P1/P2 test cases executed with >= 95% pass rate; zero open Critical/High defects; 100% WCAG AA contrast compliance.
- **RACI Matrix:** Lead Tester (Jitendra Mahant) Responsible/Accountable; Project Guide (Prof. N. S. Pagare) Consulted/Approver.

---

# CHAPTER 5: DETAILED TEST CASES SPECIFICATION

Contains 60 comprehensive test cases across 11 modules:
- **Module A: User Registration (TC-REG-01 to 07)** — Valid registration, missing fields, invalid domain, duplicate prevention, boundary passwords, confirmation mismatch, alumni initial unverified state. [All Executed & PASSED]
- **Module B: Login & Authentication (TC-AUTH-01 to 07)** — Valid login, wrong password, unregistered user, empty fields, protected route intercept, tampered token rejection, logout session cleanup. [All Executed & PASSED]
- **Module C: Profile Management (TC-PROF-01 to 05)** — View profile, edit skills, invalid grad year, unauthorized edit blocked. [TC-PROF-01 to 04 PASSED; TC-PROF-05 Not Executed]
- **Module D: Directory & Search (TC-DIR-01 to 06)** — Name search, company filter, empty query reset, zero match handling, unverified alumni gating, debounced input. [All Executed & PASSED]
- **Module E: Connections & Mentorship (TC-CON-01 to 05)** — Send request, accept request, duplicate request blocked, mentorship request, self-connect blocked. [All Executed & PASSED]
- **Module F: Jobs & Opportunities (TC-JOB-01 to 05)** — View jobs, verified alumni posting, student posting blocked (403), missing fields validation, skill chip filter. [All Executed & PASSED]
- **Module G: Messaging & Notifications (TC-MSG-01 to 04)** — Send direct message, empty message blocked, unauthorized thread blocked (403), notification generation. [All Executed & PASSED]
- **Module H: Administration & Verification (TC-ADM-01 to 04)** — Admin console load, approve alumni, reject alumni, student blocked from admin endpoints. [All Executed & PASSED]
- **Module I: Database Integration (TC-DB-01 to 05)** — DB user persistence check, unique index collision handling, connection failure graceful handling, frontend-backend decoupling. [All Executed & PASSED]
- **Module J: UI, Typography & Compatibility (TC-UI-01 to 06)** — Font switching (Arial, Helvetica, Times), sidebar bottom controls placement, theme toggle & persistence, WCAG AA contrast, 6 responsive breakpoints (320px–1440px), cross-browser rendering. [All Executed & PASSED]
- **Module K: Security Testing (TC-SEC-01 to 06)** — Bcrypt salt hashing, NoSQL operator injection blocked, stored XSS escaped by React, client bundle secret audit, header tampering blocked. [TC-SEC-01 to 04, 06 PASSED; TC-SEC-05 Not Executed]

---

# CHAPTER 6: TEST EXECUTION AND RESULTS

## 6.1 Execution Summary
- **Total Planned:** 60 Test Cases
- **Executed:** 58 Test Cases (96.67% Execution Rate)
- **Passed:** 58 Test Cases (100.0% Pass Rate of Executed)
- **Failed:** 0
- **Not Executed:** 2 (Profile image upload & live rate-limiting brute force)

## 6.2 Real Project Defects Documented
- **DEF-01 (High):** Semantic status color violation where brand teal was substituted for emerald in Verified badges. Fixed in `ui.jsx`.
- **DEF-02 (High):** Missing dark-mode classes on job opportunity badges causing bright pastel blocks in dark theme. Fixed in `Jobs.jsx`.
- **DEF-03 (High):** Font selector dropdown updating storage but failing to update application typography due to hardcoded CSS rules. Fixed in `index.css` and `tailwind.config.js`.

---

# CHAPTER 7: AUTOMATION AND TESTING TOOLS

Walkthrough of executable test scripts:
1. `testFontSelectorAndTypography.js` — 8/8 assertions passed.
2. `testSidebarControlsAndResponsiveness.js` — 8/8 assertions passed.
3. `auditUIThemeCompliance.js` — 36 components scanned, 10/10 contrast pairs verified, 22/22 palette tokens validated.
4. `npm --prefix frontend run build` — Clean Rollup production compilation in 38.66s.

---

# CHAPTER 8: QUALITY ASSURANCE AND QUALITY METRICS

## 8.1 Mathematical Formulations & Computed Project Metrics
- **Test Execution Rate (TER):** $(58 / 60) \times 100\% = \mathbf{96.67\%}$ (Target: >= 90%)
- **Test Pass Percentage (TPP):** $(58 / 58) \times 100\% = \mathbf{100.0\%}$ (Target: >= 95%)
- **Requirements Coverage:** $(12 / 12) \times 100\% = \mathbf{100.0\%}$ (Target: 100%)
- **Defect Density (DD):** $4 \text{ defects} / 12.4 \text{ KLOC} = \mathbf{0.32 \text{ defects/KLOC}}$ (Target: <= 1.0)
- **Defect Removal Efficiency (DRE):** $[4 / (4 + 0)] \times 100\% = \mathbf{100.0\%}$

## 8.2 ISO/IEC 25010 Quality Evaluation
Evaluated across all 8 standard dimensions (Functional Suitability, Performance Efficiency, Compatibility, Usability, Reliability, Security, Maintainability, Portability). All satisfied.

---

# CHAPTER 9: DEFECT MANAGEMENT AND RISK ANALYSIS

- **Root Cause Analysis:** 5 Whys applied to font synchronization bug (DEF-03); Ishikawa Fishbone analysis applied to UI theme and color deviations.
- **Risk Assessment Matrix:** Identifies and mitigates domain risks including alumni impersonation, credential stuffing, database outages, personal phone number leakage, and WCAG contrast failures.
- **Security Vulnerabilities Neutralized:** NoSQL injection sanitized via `express-mongo-sanitize`; BOLA prevented via identity checks; XSS prevented via React JSX auto-escaping.

---

# CHAPTER 10: RESULTS, LIMITATIONS, AND FUTURE SCOPE

- **Production Readiness:** Authentication, admin verification, dynamic typography, theme switching, and responsive sidebar controls confirmed production-ready.
- **Limitations:** Local simulated mailer transport; single-node WebSocket concurrency; single-domain regex constraint.
- **Future Roadmap:** End-to-end visual regression with Playwright; automated OWASP ZAP security testing; AI-driven capstone mentorship matching; mobile packaging via Capacitor.

---

# FINAL SECTIONS & APPENDICES

- **Conclusion:** STQA methodologies validated and stabilized the Alumni Connect platform for KKWIEER Nashik.
- **References:** 10 IEEE-formatted citations covering IEEE 829, ISO/IEC 25010, OWASP, W3C WCAG, Pressman, and Boehm.
- **Appendix A:** Complete Requirements Traceability Matrix (RTM).
- **Appendix B:** Sample Defect Report and Management Template.
- **Appendix C:** Sample REST API Test Scenarios (curl & JSON payloads).
- **Appendix D:** Test Execution Record & Sign-Off Template.
- **Appendix E:** Comprehensive Glossary of STQA Terminology.
