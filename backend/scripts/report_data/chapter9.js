module.exports = function getChapter9(meta) {
  return `
  <!-- CHAPTER 9 -->
  <div class="page chapter-page">
    <div class="chapter-badge">Chapter 9</div>
    <h1 class="chapter-title">DEFECT MANAGEMENT AND RISK ANALYSIS</h1>
    <hr class="heading-rule" />

    <h2>9.1 Defect Identification and Logging Workflow</h2>
    <p>
      Defect management is the systematic process of discovering, recording, analyzing, triaging, and resolving flaws within software systems. In the Alumni Connect project, defect logging adhered to strict academic documentation standards:
    </p>
    <ul>
      <li><strong>Defect Identifier:</strong> Unique alphanumeric code (e.g., <code>DEF-01</code>, <code>DEF-02</code>).</li>
      <li><strong>Summary & Environment:</strong> Concise, objective description of the failure along with runtime browser, Node.js, and OS versions.</li>
      <li><strong>Steps to Reproduce (S2R):</strong> Clear, deterministic sequence of steps allowing any engineer to replicate the exact failure state.</li>
      <li><strong>Expected vs Actual Result:</strong> Explicit contrast highlighting the requirement deviation.</li>
      <li><strong>Artifacts & Evidence:</strong> Terminal CLI logs, line numbers, and code snippets.</li>
      <li><strong>Severity & Priority:</strong> Impact-driven categorization assigned during triage.</li>
    </ul>

    <h2>9.2 Severity and Priority Classification Matrix</h2>
    <p>
      Severity represents the technical impact on the software; Priority denotes the urgency of resolution. The intersection defines the Defect Triage Matrix:
    </p>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Severity \\ Priority</th>
          <th>High Priority (P1)</th>
          <th>Medium Priority (P2)</th>
          <th>Low Priority (P3)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Critical Severity (S1)</strong></td>
          <td>Immediate release blocker. E.g., Database crashes, plaintext password leak. (Turnaround: &lt; 12 hours)</td>
          <td>Severe flaw with an emergency temporary workaround available. (Turnaround: 24 hours)</td>
          <td>Extremely rare theoretical edge case; non-blocking in current scope.</td>
        </tr>
        <tr>
          <td><strong>High Severity (S2)</strong></td>
          <td>Major feature broken on primary user path. E.g., Alumni unable to post jobs. (Turnaround: 24–48 hours)</td>
          <td>Major feature broken on secondary user path. (Turnaround: 3–5 days)</td>
          <td>High impact on deprecated or legacy edge browsers.</td>
        </tr>
        <tr>
          <td><strong>Medium Severity (S3)</strong></td>
          <td>Visible UI defect on prominent landing/dashboard view. E.g., DEF-02 dark badge failure.</td>
          <td>Inconsistent utility classes; raw Tailwind utilities. (Turnaround: Next Sprint)</td>
          <td>Minor alignment imbalance on non-standard resolutions.</td>
        </tr>
        <tr>
          <td><strong>Low Severity (S4)</strong></td>
          <td>Minor cosmetic defect; typo in prominent heading.</td>
          <td>Minor cosmetic defect in deep settings tab.</td>
          <td>Trivial cosmetic imperfection (e.g., native scrollbar styling).</td>
        </tr>
      </tbody>
    </table>

    <h2>9.3 Root Cause Analysis (RCA)</h2>
    <p>
      To prevent recurring defect patterns, two analytical Root Cause Analysis techniques were utilized:
    </p>

    <h3>9.3.1 The "5 Whys" Technique (Applied to DEF-03: Font Switching Bug)</h3>
    <ol>
      <li><strong>Why did selecting "Times New Roman" fail to change application typography?</strong>
        <br/><em>Answer:</em> Because the font on the page elements remained Arial.</li>
      <li><strong>Why did page elements remain Arial?</strong>
        <br/><em>Answer:</em> Because the <code>body</code> and heading CSS rules in <code>index.css</code> were hardcoded to <code>font-family: Arial, Helvetica, sans-serif</code>.</li>
      <li><strong>Why was Arial hardcoded in index.css?</strong>
        <br/><em>Answer:</em> Because early font standardization passes added hardcoded font stacks to eliminate unapproved web fonts (such as Inter and Roboto).</li>
      <li><strong>Why wasn't the dynamic custom property used instead?</strong>
        <br/><em>Answer:</em> The CSS rule author had not coupled the static font standardization mandate with the reactive <code>--app-font-family</code> theme variable.</li>
      <li><strong>Root Cause:</strong> Lack of architectural alignment between global font standardization rules and runtime theme provider variables.
        <br/><em>Corrective Action:</em> Unified <code>index.css</code> and Tailwind configuration to strictly inherit from <code>var(--app-font-family)</code>.</li>
    </ol>

    <h3>9.3.2 Ishikawa (Fishbone) Diagram Analysis</h3>
    <div class="diagram-box">
      <div class="diagram-title">Figure 9.1: Ishikawa (Fishbone) Diagram for UI Theme & Semantic Color Deviations</div>
      <div class="fishbone-text">
        <p><strong>[ PEOPLE / DEVELOPERS ]</strong> &rarr; Conflated brand accent (Teal) with status (Emerald); unaware of WCAG dark contrast rules.</p>
        <p><strong>[ PROCESS / SPECIFICATION ]</strong> &rarr; Design system rules documented in text but lacked automated linting assertions.</p>
        <p><strong>[ METHODS / CODE CONSTRUCTS ]</strong> &rarr; Ad-hoc inline Tailwind utilities bypass centralized theme classes (.badge, .btn-primary).</p>
        <p><strong>[ TOOLS / ENVIRONMENT ]</strong> &rarr; Traditional unit tests do not inspect rendered CSS computed properties or contrast ratios.</p>
        <p style="text-align: right; font-weight: bold; color: #b91c1c;">&rArr; EFFECT: Semantic Inconsistencies & Dark Mode Visual Defects</p>
      </div>
    </div>

    <h2>9.4 Software Risk Assessment Matrix</h2>
    <p>
      Software risk is quantified as $Risk = \text{Likelihood} \times \text{Impact}$. Table 9.3 evaluates the project risk profile:
    </p>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Risk Identifier</th>
          <th>Risk Event / Threat Scenario</th>
          <th>Likelihood (1–5)</th>
          <th>Impact (1–5)</th>
          <th>Risk Score (L &times; I)</th>
          <th>Risk Level</th>
          <th>Mitigation Protocol</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>RSK-SEC-01</strong></td>
          <td>Unauthorized Alumni Impersonation (Student registering as Alumni).</td>
          <td>4 (High)</td>
          <td>5 (Critical)</td>
          <td><strong>20</strong></td>
          <td><span class="priority-p1">Critical</span></td>
          <td>Enforce mandatory pending verification queue; unverified alumni hidden from directory.</td>
        </tr>
        <tr>
          <td><strong>RSK-SEC-02</strong></td>
          <td>Credential Stuffing / Account Enumeration on Login endpoint.</td>
          <td>3 (Medium)</td>
          <td>4 (Major)</td>
          <td><strong>12</strong></td>
          <td><span class="priority-p2">High</span></td>
          <td>Identical generic error message ("Invalid email or password") returned for both cases.</td>
        </tr>
        <tr>
          <td><strong>RSK-DAT-03</strong></td>
          <td>Database Connection Failure during peak campus placement hours.</td>
          <td>2 (Low)</td>
          <td>5 (Critical)</td>
          <td><strong>10</strong></td>
          <td><span class="priority-p2">High</span></td>
          <td>Automated reconnection logic; informative 503 Service Unavailable responses.</td>
        </tr>
        <tr>
          <td><strong>RSK-DAT-04</strong></td>
          <td>Accidental leakage of student/alumni personal mobile phone numbers.</td>
          <td>3 (Medium)</td>
          <td>4 (Major)</td>
          <td><strong>12</strong></td>
          <td><span class="priority-p2">High</span></td>
          <td>Schema sanitization; zero mobile phone number fields stored or rendered in public profiles.</td>
        </tr>
        <tr>
          <td><strong>RSK-UI-05</strong></td>
          <td>WCAG contrast failure causing accessibility barriers for visually impaired users.</td>
          <td>4 (High)</td>
          <td>2 (Minor)</td>
          <td><strong>8</strong></td>
          <td><span class="priority-p3">Medium</span></td>
          <td>Automated static token scanner enforcing &ge; 4.5:1 contrast ratios in build pipeline.</td>
        </tr>
      </tbody>
    </table>

    <h2>9.5 Alumni Connect Domain-Specific Vulnerabilities and Mitigation</h2>
    <ol>
      <li><strong>NoSQL Operator Injection:</strong> Attackers submitting JSON objects like <code>{"email": {"$gt": ""}}</code> to bypass authentication.
      <br/><em>Mitigation:</em> Configured <code>express-mongo-sanitize</code> middleware which recursively strips any keys containing <code>$</code> or <code>.</code> from <code>req.body</code>, <code>req.query</code>, and <code>req.params</code>.</li>
      <li><strong>Broken Object Level Authorization (BOLA):</strong> Malicious users changing URL parameter IDs to alter other users' profiles or guidance records.
      <br/><em>Mitigation:</em> Enforced identity checks in controllers: <code>if (profile.user.toString() !== req.user.id &amp;&amp; req.user.role !== 'admin') return res.status(403)</code>.</li>
      <li><strong>Cross-Site Scripting (XSS) in Q&A Forums:</strong> Malicious users injecting <code>&lt;script&gt;</code> payloads in question descriptions.
      <br/><em>Mitigation:</em> React's virtual DOM engine treats JSX children as strings, escaping HTML characters automatically. Backend input validation also sanitizes HTML entities.</li>
    </ol>

    <h2>9.6 Corrective Action Protocols</h2>
    <p>
      Whenever a defect is logged in the project repository:
    </p>
    <ul>
      <li><strong>Isolation:</strong> A dedicated git branch is spawned to isolate the defect fix.</li>
      <li><strong>Test-First Reproduction:</strong> A failing test assertion is written to mathematically reproduce the defect before modifying production code.</li>
      <li><strong>Patch & Verify:</strong> Code is patched until the reproduction test passes.</li>
      <li><strong>Full Regression Pass:</strong> Complete test suites (<code>testFontSelectorAndTypography.js</code>, <code>testSidebarControlsAndResponsiveness.js</code>, <code>npm run build</code>) are re-executed before merging into the main branch.</li>
    </ul>
  </div>
  `;
};
