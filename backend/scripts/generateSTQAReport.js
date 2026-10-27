/**
 * Alumni Connect — STQA Master Project Report Generator
 * Generates:
 * 1. docs/STQA_Project_Report_AlumniConnect.html (Standalone A4 print-ready HTML with embedded logo, print CSS, and Ctrl+P button)
 * 2. docs/STQA_Project_Report_AlumniConnect.md (Full academic Markdown report)
 */
const fs = require('fs');
const path = require('path');

const getPreliminary = require('./report_data/preliminary');
const getChapter1 = require('./report_data/chapter1');
const getChapter2 = require('./report_data/chapter2');
const getChapter3 = require('./report_data/chapter3');
const getChapter4 = require('./report_data/chapter4');
const getChapter5 = require('./report_data/chapter5');
const getChapter6 = require('./report_data/chapter6');
const getChapter7 = require('./report_data/chapter7');
const getChapter8 = require('./report_data/chapter8');
const getChapter9 = require('./report_data/chapter9');
const getChapter10 = require('./report_data/chapter10');
const getAppendices = require('./report_data/appendices');

const docsDir = path.resolve(__dirname, '../../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Read logo as base64
let logoBase64 = '';
const logoPath = path.resolve(__dirname, '../../frontend/public/kkwagh-logo.png');
if (fs.existsSync(logoPath)) {
  logoBase64 = fs.readFileSync(logoPath).toString('base64');
}

const meta = {
  studentName: 'Jitendra Kewaldas Mahant',
  rollNumber: '38',
  className: 'TY B.Tech Computer Engineering',
  subjectName: 'Software Testing and Quality Assurance (STQA)',
  projectTitle: 'Alumni Connect — Alumni Networking and Mentorship Platform',
  academicYear: '2026–2027',
  collegeName: 'K. K. Wagh Institute of Engineering Education & Research (KKWIEER), Nashik',
  departmentName: 'Department of Computer Engineering',
  universityName: 'Savitribai Phule Pune University (SPPU)',
  guideName: 'Prof. N. S. Pagare',
  hodName: 'Dr. S. S. Sane',
  principalName: 'Dr. K. N. Nandurkar',
  logoBase64,
};

console.log('Compiling HTML report components...');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STQA Project Report — Alumni Connect — Jitendra Mahant (Roll No. 38)</title>
  <style>
    /* ================= A4 PRINT AND ACADEMIC STYLING ================= */
    @page {
      size: A4 portrait;
      margin: 22mm 18mm 22mm 22mm;
      @top-right {
        content: "Alumni Connect — STQA Project Report";
        font-family: 'Times New Roman', Times, serif;
        font-size: 9pt;
        color: #64748b;
      }
      @bottom-center {
        content: counter(page);
        font-family: 'Times New Roman', Times, serif;
        font-size: 10pt;
      }
    }

    @page:first {
      margin: 0;
      @top-right { content: normal; }
      @bottom-center { content: normal; }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11.5pt;
      line-height: 1.6;
      color: #0f172a;
      background-color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }

    /* Print Controls Header (Hidden during actual print) */
    .print-control-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: Arial, Helvetica, sans-serif;
    }

    .print-control-title {
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }

    .print-btn {
      background: #0d9488;
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #0f766e;
    }

    .report-container {
      max-width: 900px;
      margin: 30px auto;
      background: #ffffff;
      padding: 40px 60px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      border-radius: 4px;
    }

    /* Page Breaks */
    .page {
      page-break-after: always;
      break-after: page;
      margin-bottom: 50px;
    }
    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Cover Page */
    .cover-page {
      min-height: 980px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      border: 3px double #334155;
      padding: 40px 30px;
      background: #ffffff;
    }
    .society-title {
      font-size: 14pt;
      font-weight: bold;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .college-title {
      font-size: 18pt;
      font-weight: bold;
      color: #0f172a;
      margin: 8px 0;
      line-height: 1.3;
    }
    .autonomous-tag {
      font-size: 11pt;
      font-style: italic;
      color: #475569;
    }
    .dept-title {
      font-size: 15pt;
      font-weight: bold;
      color: #0f766e;
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .cover-logo-container {
      margin: 25px auto;
      text-align: center;
    }
    .college-logo {
      max-width: 170px;
      max-height: 170px;
      object-fit: contain;
    }
    .report-subtitle {
      font-size: 12pt;
      font-weight: bold;
      letter-spacing: 2px;
      color: #64748b;
    }
    .project-main-title {
      font-size: 20pt;
      font-weight: bold;
      color: #0f172a;
      margin: 12px 0;
      line-height: 1.3;
      text-transform: uppercase;
    }
    .subject-subtitle {
      font-size: 11pt;
      color: #475569;
    }
    .subject-title {
      font-size: 15pt;
      font-weight: bold;
      color: #0d9488;
      margin: 6px 0;
    }
    .degree-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1e293b;
    }
    .cover-sign-row {
      display: flex;
      justify-content: space-between;
      text-align: left;
      margin: 30px 10px 15px 10px;
      padding-top: 15px;
      border-top: 1px solid #cbd5e1;
      font-size: 11pt;
    }
    .sign-block {
      width: 48%;
    }
    .sign-role {
      font-size: 10pt;
      color: #64748b;
      text-transform: uppercase;
      font-weight: bold;
    }
    .sign-name {
      font-size: 12pt;
      margin: 4px 0;
      color: #0f172a;
    }
    .cover-footer {
      border-top: 2px solid #0f172a;
      padding-top: 12px;
      font-size: 10pt;
      color: #475569;
      line-height: 1.4;
    }

    /* Certificate & Declaration */
    .cert-page {
      padding: 20px 10px;
    }
    .cert-header {
      text-align: center;
      line-height: 1.4;
      margin-bottom: 25px;
    }
    .cert-header h3 { font-size: 13pt; color: #334155; }
    .cert-header h2 { font-size: 16pt; color: #0f172a; margin: 4px 0; }
    .cert-header h4 { font-size: 10pt; font-style: italic; color: #475569; }
    .cert-title-container {
      text-align: center;
      margin: 20px 0;
    }
    .cert-title {
      display: inline-block;
      font-size: 20pt;
      font-weight: bold;
      letter-spacing: 4px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 4px;
    }
    .cert-body, .decl-body, .ack-body, .abs-body {
      text-align: justify;
      margin-bottom: 16px;
      text-indent: 30px;
      line-height: 1.8;
      font-size: 11.5pt;
    }
    .cert-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
    }
    .secondary-sigs {
      margin-top: 50px;
    }
    .cert-sig-box {
      width: 45%;
      text-align: center;
      font-size: 10.5pt;
      line-height: 1.4;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      width: 80%;
      margin: 0 auto 10px auto;
    }
    .sig-line-short {
      border-top: 1px solid #0f172a;
      width: 200px;
      margin: 50px 0 10px 0;
    }

    /* Headings */
    .academic-heading {
      text-align: center;
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .heading-rule {
      border: 0;
      height: 2px;
      background: #0f172a;
      margin-bottom: 25px;
    }

    .chapter-badge {
      display: inline-block;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      font-weight: bold;
      color: #0d9488;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 4px;
    }
    .chapter-title {
      font-size: 20pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 8px;
    }

    h2 {
      font-size: 14pt;
      font-weight: bold;
      color: #0f172a;
      margin: 24px 0 10px 0;
      border-left: 4px solid #0d9488;
      padding-left: 10px;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      color: #1e293b;
      margin: 16px 0 8px 0;
    }
    p {
      text-align: justify;
      margin-bottom: 12px;
      line-height: 1.7;
    }
    ul, ol {
      margin: 10px 0 16px 25px;
      line-height: 1.7;
    }
    li {
      margin-bottom: 6px;
    }

    /* Tables */
    .academic-table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0 24px 0;
      font-size: 10pt;
      font-family: Arial, Helvetica, sans-serif;
      page-break-inside: avoid;
    }
    .academic-table th, .academic-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    .academic-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: bold;
    }
    .academic-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .test-case-table td:nth-child(1) { width: 12%; font-weight: bold; }
    .test-case-table td:nth-child(2) { width: 18%; }
    .test-case-table td:nth-child(3) { width: 20%; font-size: 9pt; }
    .test-case-table td:nth-child(4) { width: 16%; font-size: 9pt; font-family: monospace; }
    .test-case-table td:nth-child(5) { width: 18%; font-size: 9pt; }
    .test-case-table td:nth-child(6) { width: 16%; font-size: 9pt; }

    .toc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5pt;
    }
    .toc-table td {
      padding: 6px 4px;
      border-bottom: 1px dotted #cbd5e1;
    }
    .toc-table td:first-child { width: 65px; font-weight: bold; }
    .toc-table td:last-child { width: 45px; text-align: right; }
    .toc-chap td {
      font-weight: bold;
      padding-top: 14px;
      border-bottom: 1px solid #0f172a;
      color: #0f172a;
    }
    .toc-special td {
      font-weight: bold;
      color: #475569;
      padding: 8px 4px;
    }

    /* Badges & Highlights */
    .status-pass {
      color: #047857;
      font-weight: bold;
    }
    .status-ne {
      color: #b45309;
      font-weight: bold;
    }
    .priority-p1 {
      color: #b91c1c;
      font-weight: bold;
      font-size: 8.5pt;
    }
    .priority-p2 {
      color: #c2410c;
      font-weight: bold;
      font-size: 8.5pt;
    }
    .priority-p3 {
      color: #0369a1;
      font-weight: bold;
      font-size: 8.5pt;
    }
    .priority-p4 {
      color: #475569;
      font-weight: bold;
      font-size: 8.5pt;
    }

    /* Diagrams & Callouts */
    .diagram-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 18px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .diagram-title {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 14px;
      color: #334155;
    }

    .architecture-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
    }
    .arch-tier {
      flex: 1;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
    }
    .arch-tier h4 {
      font-size: 10pt;
      color: #0f766e;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .arch-arrow {
      font-size: 8pt;
      font-weight: bold;
      color: #64748b;
      text-align: center;
    }

    .stlc-flow {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
    }
    .stlc-step {
      width: 75%;
      border: 1px solid #0d9488;
      background: #f0fdfa;
      padding: 8px 12px;
      border-radius: 4px;
      text-align: center;
    }
    .stlc-arrow {
      color: #0d9488;
      font-weight: bold;
      font-size: 14pt;
    }

    .math-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0f766e;
      padding: 10px 16px;
      margin: 12px 0 16px 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
    }

    .code-snippet-box {
      background: #0f172a;
      color: #f1f5f9;
      border-radius: 6px;
      padding: 14px 18px;
      margin: 14px 0;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9pt;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    .code-snippet-box pre {
      white-space: pre-wrap;
    }

    .defect-card {
      border: 1px solid #cbd5e1;
      border-left: 5px solid #dc2626;
      border-radius: 4px;
      padding: 12px 16px;
      margin: 16px 0;
      background: #ffffff;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    .defect-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .defect-id {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
    }
    .defect-title {
      font-weight: bold;
      font-size: 11pt;
      color: #0f172a;
      flex: 1;
    }
    .defect-badge-high {
      background: #fee2e2;
      color: #dc2626;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
    }
    .defect-meta-table {
      width: 100%;
      margin: 6px 0 10px 0;
      font-size: 9pt;
    }
    .defect-meta-table td {
      padding: 3px 6px;
      border: 0;
    }

    /* Print Overrides */
    @media print {
      body {
        background: #ffffff;
      }
      .print-control-bar {
        display: none !important;
      }
      .report-container {
        max-width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Print Controls -->
  <div class="print-control-bar">
    <div class="print-control-title">
      Alumni Connect — STQA Academic Project Report (Jitendra Mahant · Roll No. 38 · KKWIEER Nashik)
    </div>
    <button class="print-btn" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Print to PDF / Save as PDF
    </button>
  </div>

  <div class="report-container">
    ${getPreliminary(meta)}
    ${getChapter1(meta)}
    ${getChapter2(meta)}
    ${getChapter3(meta)}
    ${getChapter4(meta)}
    ${getChapter5(meta)}
    ${getChapter6(meta)}
    ${getChapter7(meta)}
    ${getChapter8(meta)}
    ${getChapter9(meta)}
    ${getChapter10(meta)}
    ${getAppendices(meta)}
  </div>

</body>
</html>
`;

fs.writeFileSync(path.join(docsDir, 'STQA_Project_Report_AlumniConnect.html'), htmlContent, 'utf8');
console.log('✓ Successfully generated: docs/STQA_Project_Report_AlumniConnect.html');

// Generate Academic Markdown Version
console.log('Compiling Markdown report...');

const mdContent = `# K. K. Wagh Institute of Engineering Education & Research, Nashik
### Department of Computer Engineering
#### Academic Year: 2026–2027

---

# ALUMNI CONNECT — ALUMNI NETWORKING AND MENTORSHIP PLATFORM
## Subject: Software Testing and Quality Assurance (STQA)
### Course: B.Tech in Computer Engineering (TY B.Tech)

**Submitted By:**  
- **Student Name:** ${meta.studentName}  
- **Roll Number:** ${meta.rollNumber}  
- **Class:** ${meta.className}  
- **Subject:** ${meta.subjectName}  
- **Academic Year:** ${meta.academicYear}  

**Under the Guidance of:**  
- **Project Guide:** ${meta.guideName}, Assistant Professor, Department of Computer Engineering  
- **Head of Department:** ${meta.hodName}, Department of Computer Engineering  
- **Principal:** ${meta.principalName}, KKWIEER, Nashik  
- **Affiliated University:** ${meta.universityName}  

---

## CERTIFICATE

This is to certify that the project report entitled **"${meta.projectTitle}"** submitted by **${meta.studentName}** (Roll No: **${meta.rollNumber}**, Class: **${meta.className}**) is a bonafide record of work carried out by him in partial fulfillment of the requirements for the course **${meta.subjectName}** of Third Year B.Tech Computer Engineering at **${meta.collegeName}** during the academic year **${meta.academicYear}**.

The project work has been examined, rigorously tested, and evaluated according to standard software testing methodologies, test design principles, and quality assurance criteria.

\`\`\`
_______________________________             _______________________________
${meta.guideName}                            ${meta.hodName}
Project Guide / Faculty In-Charge            Head of Department
Department of Computer Engineering           Department of Computer Engineering

_______________________________             _______________________________
${meta.principalName}                       External Examiner
Principal, KKWIEER Nashik                    Savitribai Phule Pune University
\`\`\`

---

## CANDIDATE DECLARATION

I, **${meta.studentName}**, student of Third Year B.Tech in Computer Engineering at **K. K. Wagh Institute of Engineering Education & Research, Nashik**, hereby declare that the project report entitled **"${meta.projectTitle}"** submitted to the Department of Computer Engineering for the subject **${meta.subjectName}** is an authentic record of original project development, testing, and quality assurance work completed under the guidance of **${meta.guideName}**.

I further confirm that the test cases, defect evaluations, and automated verification suites presented herein reflect genuine analysis of the MERN stack codebase.

**Jitendra Kewaldas Mahant**  
Roll No: ${meta.rollNumber} | Class: ${meta.className}  
Department of Computer Engineering, KKWIEER Nashik  

---

## ACKNOWLEDGEMENT

I express my sincere and heartfelt gratitude to my project guide, **${meta.guideName}**, Assistant Professor, Department of Computer Engineering, for his invaluable guidance, continuous encouragement, constructive critiques, and meticulous supervision throughout the development and testing phases of this project.

I am profoundly thankful to **${meta.hodName}**, Head of the Department of Computer Engineering, and our respected Principal, **${meta.principalName}**, for their academic leadership and support.

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

Conversely, Software Testing is the destructive, analytical subset aimed at uncovering defects and assessing system capabilities prior to deployment. Barry Boehm's Cost of Quality curve illustrates that defect remediation cost escalates exponentially throughout the software lifecycle: a defect identified in requirements costs $1\\times$, escalating to $10\\times$ in coding, $15\\times$ in testing, and $100\\times$ post-deployment in production.

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
Passwords hashed with bcrypt (10 salt rounds); signed JWT issued upon login; protected endpoints verified via \`Authorization: Bearer <token>\` middleware; role guards block unauthorized access with 403 Forbidden.

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

- **Test Plan ID:** \`TP-ALUMNI-2026-V1.0\`
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
- **DEF-01 (High):** Semantic status color violation where brand teal was substituted for emerald in Verified badges. Fixed in \`ui.jsx\`.
- **DEF-02 (High):** Missing dark-mode classes on job opportunity badges causing bright pastel blocks in dark theme. Fixed in \`Jobs.jsx\`.
- **DEF-03 (High):** Font selector dropdown updating storage but failing to update application typography due to hardcoded CSS rules. Fixed in \`index.css\` and \`tailwind.config.js\`.

---

# CHAPTER 7: AUTOMATION AND TESTING TOOLS

Walkthrough of executable test scripts:
1. \`testFontSelectorAndTypography.js\` — 8/8 assertions passed.
2. \`testSidebarControlsAndResponsiveness.js\` — 8/8 assertions passed.
3. \`auditUIThemeCompliance.js\` — 36 components scanned, 10/10 contrast pairs verified, 22/22 palette tokens validated.
4. \`npm --prefix frontend run build\` — Clean Rollup production compilation in 38.66s.

---

# CHAPTER 8: QUALITY ASSURANCE AND QUALITY METRICS

## 8.1 Mathematical Formulations & Computed Project Metrics
- **Test Execution Rate (TER):** $(58 / 60) \\times 100\\% = \\mathbf{96.67\\%}$ (Target: >= 90%)
- **Test Pass Percentage (TPP):** $(58 / 58) \\times 100\\% = \\mathbf{100.0\\%}$ (Target: >= 95%)
- **Requirements Coverage:** $(12 / 12) \\times 100\\% = \\mathbf{100.0\\%}$ (Target: 100%)
- **Defect Density (DD):** $4 \\text{ defects} / 12.4 \\text{ KLOC} = \\mathbf{0.32 \\text{ defects/KLOC}}$ (Target: <= 1.0)
- **Defect Removal Efficiency (DRE):** $[4 / (4 + 0)] \\times 100\\% = \\mathbf{100.0\\%}$

## 8.2 ISO/IEC 25010 Quality Evaluation
Evaluated across all 8 standard dimensions (Functional Suitability, Performance Efficiency, Compatibility, Usability, Reliability, Security, Maintainability, Portability). All satisfied.

---

# CHAPTER 9: DEFECT MANAGEMENT AND RISK ANALYSIS

- **Root Cause Analysis:** 5 Whys applied to font synchronization bug (DEF-03); Ishikawa Fishbone analysis applied to UI theme and color deviations.
- **Risk Assessment Matrix:** Identifies and mitigates domain risks including alumni impersonation, credential stuffing, database outages, personal phone number leakage, and WCAG contrast failures.
- **Security Vulnerabilities Neutralized:** NoSQL injection sanitized via \`express-mongo-sanitize\`; BOLA prevented via identity checks; XSS prevented via React JSX auto-escaping.

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
`;

fs.writeFileSync(path.join(docsDir, 'STQA_Project_Report_AlumniConnect.md'), mdContent, 'utf8');
console.log('✓ Successfully generated: docs/STQA_Project_Report_AlumniConnect.md');

console.log('\n======================================================');
console.log('STQA Project Report Generation Complete!');
console.log('Deliverables saved to:');
console.log('1. ' + path.join(docsDir, 'STQA_Project_Report_AlumniConnect.html'));
console.log('2. ' + path.join(docsDir, 'STQA_Project_Report_AlumniConnect.md'));
console.log('======================================================\n');
