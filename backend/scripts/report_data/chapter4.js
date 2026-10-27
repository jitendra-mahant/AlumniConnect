module.exports = function getChapter4(meta) {
  return `
  <!-- CHAPTER 4 -->
  <div class="page chapter-page">
    <div class="chapter-badge">Chapter 4</div>
    <h1 class="chapter-title">TEST PLAN (IEEE 829 STANDARD)</h1>
    <hr class="heading-rule" />

    <h2>4.1 Test Plan Identifier and Metadata</h2>
    <table class="academic-table">
      <tbody>
        <tr><td><strong>Test Plan Identifier:</strong></td><td><code>TP-ALUMNI-2026-V1.0</code></td></tr>
        <tr><td><strong>Project Name:</strong></td><td>Alumni Connect — Alumni Networking and Mentorship Platform</td></tr>
        <tr><td><strong>Author / Lead Tester:</strong></td><td>Jitendra Kewaldas Mahant (Roll No. 38)</td></tr>
        <tr><td><strong>Supervising Faculty:</strong></td><td>Prof. N. S. Pagare, Department of Computer Engineering</td></tr>
        <tr><td><strong>Institution:</strong></td><td>K. K. Wagh Institute of Engineering Education & Research (KKWIEER), Nashik</td></tr>
        <tr><td><strong>Date of Document:</strong></td><td>October 26, 2026</td></tr>
        <tr><td><strong>Status:</strong></td><td>Approved Baseline for Academic Submission</td></tr>
      </tbody>
    </table>

    <h2>4.2 Testing Objectives and Success Criteria</h2>
    <p>
      The primary objective of this Test Plan is to define the verification framework, resources, scope, and quality criteria for Alumni Connect:
    </p>
    <ul>
      <li><strong>Defect Detection & Prevention:</strong> Identify, log, and rectify all Critical (P1) and High (P2) defects prior to final evaluation.</li>
      <li><strong>Authentication Robustness:</strong> Verify that registration, login, and session validation reject 100% of invalid, unauthorized, or malformed credentials.</li>
      <li><strong>Data Integrity:</strong> Ensure that MongoDB transactions maintain schema constraints and prevent duplicate entity insertion.</li>
      <li><strong>Design System Compliance:</strong> Verify 100% adherence to typography (Arial, Helvetica, Times New Roman), approved teal-slate color palettes, and WCAG 2.1 AA accessibility standards.</li>
      <li><strong>Responsive Usability:</strong> Confirm seamless usability across target viewports without layout clipping or horizontal scrolling.</li>
    </ul>

    <h2>4.3 Features to be Tested (In-Scope)</h2>
    <ol>
      <li><strong>User Registration Module:</strong> Email format validation, institutional domain enforcement (<code>@kkwagh.edu.in</code>), duplicate detection, password strength, and MongoDB user record persistence.</li>
      <li><strong>Authentication & Session Management:</strong> Valid credentials login, invalid password rejection, non-existent user handling, JWT token generation, Bearer header transmission, and session termination.</li>
      <li><strong>Role-Based Access Control (RBAC):</strong> Verification that Student, Alumni, Teacher, and Admin roles can only access authorized endpoints and views.</li>
      <li><strong>Alumni Directory & Search:</strong> Name, batch, company, and skill search queries, empty search handling, unverified alumni visibility suppression.</li>
      <li><strong>Connections & Mentorship Workflow:</strong> Connection requests, status state machine (pending/accepted/rejected), mentorship guidance scheduling.</li>
      <li><strong>Jobs & Opportunities Board:</strong> Opportunity posting by verified alumni, referral requests, search and tag filtering.</li>
      <li><strong>Administrative Verification Console:</strong> Pending queue rendering, batch approvals, rejections, audit log recording.</li>
      <li><strong>UI Theme & Typography Engine:</strong> Light/Dark theme switching, dynamic font selection, sidebar placement, local storage persistence.</li>
      <li><strong>Database Persistence & Index Integrity:</strong> Schema validation, unique index enforcement, database reconnection handling.</li>
    </ol>

    <h2>4.4 Features Not to be Tested (Out-of-Scope)</h2>
    <ul>
      <li>Live external SMS gateway integration (simulated via console logs).</li>
      <li>High-volume distributed load testing exceeding 10,000 concurrent requests.</li>
      <li>Third-party OAuth identity providers (Google/LinkedIn login).</li>
      <li>Payment gateway integration for alumni donations.</li>
      <li>Browser legacy testing on Internet Explorer 11 and deprecated mobile OS versions.</li>
    </ul>

    <h2>4.5 Testing Approach and Strategy</h2>
    <p>
      The test strategy adopts a blended, bottom-up pyramid approach:
    </p>
    <ul>
      <li><strong>Layer 1 (Unit & Static Analysis):</strong> Static linting, token scanning scripts, and isolated function tests for utility and crypto helpers.</li>
      <li><strong>Layer 2 (API & Integration Testing):</strong> Programmatic execution of REST API endpoints using Supertest and in-memory MongoDB, verifying status codes, schema mutations, and JWT middleware.</li>
      <li><strong>Layer 3 (UI & System Testing):</strong> Automated layout and typography assertions combined with manual exploratory, accessibility, and cross-browser testing.</li>
    </ul>

    <h2>4.6 Test Environment Setup</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Environment Component</th>
          <th>Configuration Details</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>Operating System</strong></td><td>Microsoft Windows 11 Enterprise (64-bit)</td></tr>
        <tr><td><strong>Runtime Version</strong></td><td>Node.js v24.22.1 / npm v10.8.x</td></tr>
        <tr><td><strong>Database Environment</strong></td><td>MongoDB Memory Server v10.1.2 (for automated runs) & MongoDB v7.0 Local Daemon</td></tr>
        <tr><td><strong>Client Browsers</strong></td><td>Google Chrome 130+, Microsoft Edge 130+, Mozilla Firefox 131+</td></tr>
        <tr><td><strong>API Test Client</strong></td><td>Postman Desktop v11.x & Supertest via Node.js scripts</td></tr>
        <tr><td><strong>Build System</strong></td><td>Vite v5.4.21 with Rollup bundling</td></tr>
      </tbody>
    </table>

    <h2>4.7 Test Data Requirements and Synthetic Payloads</h2>
    <p>
      Testing utilizes synthetic, non-production test datasets designed to cover nominal, boundary, and hostile scenarios:
    </p>
    <ul>
      <li><strong>Valid Institutional Accounts:</strong>
        <ul>
          <li>Student: <code>student.test@kkwagh.edu.in</code> / <code>Student@Pass123</code></li>
          <li>Alumni: <code>alumni.test@kkwagh.edu.in</code> / <code>Alumni@Pass123</code></li>
          <li>Faculty: <code>faculty.test@kkwagh.edu.in</code> / <code>Teacher@Pass123</code></li>
          <li>Administrator: <code>admin.test@kkwagh.edu.in</code> / <code>Admin@Pass123</code></li>
        </ul>
      </li>
      <li><strong>Hostile & Boundary Payloads:</strong>
        <ul>
          <li>NoSQL Injection: <code>{"$gt": ""}</code>, <code>{"$ne": null}</code> in login payloads.</li>
          <li>XSS Vector Payloads: <code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code>, <code>&lt;img src=x onerror=alert(1)&gt;</code> in message and profile fields.</li>
          <li>Extreme Strings: 1,000-character strings in name and headline fields; empty strings; strings containing null bytes.</li>
        </ul>
      </li>
    </ul>

    <h2>4.8 Entry and Exit Criteria</h2>
    <h3>4.8.1 Entry Criteria</h3>
    <ul>
      <li>Application build completes cleanly with zero compilation errors (<code>npm run build</code> passes).</li>
      <li>Database connection initialized (either local MongoDB instance or in-memory server).</li>
      <li>Baseline test scripts, test data, and IEEE 829 test specifications approved by Guide.</li>
    </ul>

    <h3>4.8.2 Exit Criteria</h3>
    <ul>
      <li>100% of planned Critical (P1) and High (P2) test cases executed with a minimum 95% pass rate.</li>
      <li>Zero unresolved Critical (Severity 1) or High (Severity 2) defects remaining in the active codebase.</li>
      <li>Static UI theme audit confirms zero missing core CSS variables and 100% WCAG 2.1 AA contrast compliance.</li>
      <li>All automated regression test suites execute with zero failures.</li>
    </ul>

    <h2>4.9 Roles and Responsibilities (RACI Matrix)</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Testing Activity</th>
          <th>Lead Tester (Jitendra Mahant)</th>
          <th>Project Guide (Prof. N. S. Pagare)</th>
          <th>Peer Reviewer</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Test Plan Authoring</td><td>Accountable & Responsible</td><td>Consulted & Approver</td><td>Informed</td></tr>
        <tr><td>Test Case Design</td><td>Accountable & Responsible</td><td>Consulted</td><td>Reviewed</td></tr>
        <tr><td>Test Environment Provisioning</td><td>Accountable & Responsible</td><td>Informed</td><td>Informed</td></tr>
        <tr><td>Test Execution & Scripting</td><td>Accountable & Responsible</td><td>Informed</td><td>Supported</td></tr>
        <tr><td>Defect Logging & Triage</td><td>Accountable & Responsible</td><td>Consulted</td><td>Informed</td></tr>
        <tr><td>Quality Metrics & Final Sign-Off</td><td>Responsible</td><td>Accountable & Approver</td><td>Informed</td></tr>
      </tbody>
    </table>

    <h2>4.10 Test Deliverables</h2>
    <ol>
      <li>IEEE 829 Master Test Plan Document.</li>
      <li>Detailed Test Case Specifications Table (Chapter 5).</li>
      <li>Automated Test Execution Scripts (<code>testFontSelectorAndTypography.js</code>, <code>testSidebarControlsAndResponsiveness.js</code>, <code>auditUIThemeCompliance.js</code>).</li>
      <li>Defect Tracking Log and Root Cause Analysis Reports (Chapter 6 & 9).</li>
      <li>Requirements Traceability Matrix (Appendix A).</li>
      <li>Final STQA Project Evaluation and Sign-Off Report.</li>
    </ol>

    <h2>4.11 Risks and Mitigation Strategies</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Risk ID</th>
          <th>Identified Risk Description</th>
          <th>Severity</th>
          <th>Likelihood</th>
          <th>Proactive Mitigation Strategy</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>RSK-01</td><td>Local MongoDB connection refused during automated script runs.</td><td>High</td><td>Medium</td><td>Integrated <code>mongodb-memory-server</code> fallback in test scripts for hermetic execution.</td></tr>
        <tr><td>RSK-02</td><td>Regression defects introduced during UI refactoring (e.g. sidebar controls move).</td><td>High</td><td>Medium</td><td>Automated typography and sidebar positioning assertion scripts executed post-refactoring.</td></tr>
        <tr><td>RSK-03</td><td>Cross-browser contrast failures in dark mode due to missing CSS classes.</td><td>Medium</td><td>High</td><td>Engineered custom static scanner calculating WCAG contrast ratios across all 36 JSX components.</td></tr>
        <tr><td>RSK-04</td><td>Duplicate account registration allowing duplicate institutional emails.</td><td>Critical</td><td>Low</td><td>Enforced Mongoose unique indexing combined with controller-level normalized case lookups.</td></tr>
      </tbody>
    </table>

    <h2>4.12 Testing Schedule and Milestones</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Milestone</th>
          <th>Target Completion Date</th>
          <th>Deliverable / Artifact</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>M1: Requirements & STLC Plan</td><td>Week 1 (Oct 2026)</td><td>Approved Test Plan & RACI Matrix</td><td>Completed</td></tr>
        <tr><td>M2: Test Case Design (A to K)</td><td>Week 2 (Oct 2026)</td><td>Comprehensive Test Specification Table</td><td>Completed</td></tr>
        <tr><td>M3: Automated Scripting & Suites</td><td>Week 3 (Oct 2026)</td><td>Executable Node.js Test Suites</td><td>Completed</td></tr>
        <tr><td>M4: Static Theme & Contrast Audit</td><td>Week 3 (Oct 2026)</td><td>36-Component Theme Compliance Report</td><td>Completed</td></tr>
        <tr><td>M5: Defect Remediation & Regression</td><td>Week 4 (Oct 2026)</td><td>Closed Defect Reports & Regression Pass</td><td>Completed</td></tr>
        <tr><td>M6: Final Sign-Off & Report Submission</td><td>Week 4 (Oct 2026)</td><td>Bound STQA Academic Project Report</td><td>Completed</td></tr>
      </tbody>
    </table>
  </div>
  `;
};
