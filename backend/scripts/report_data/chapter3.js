module.exports = function getChapter3(meta) {
  return `
  <!-- CHAPTER 3 -->
  <div class="page chapter-page">
    <div class="chapter-badge">Chapter 3</div>
    <h1 class="chapter-title">SOFTWARE TESTING METHODOLOGY</h1>
    <hr class="heading-rule" />

    <h2>3.1 Software Testing Life Cycle (STLC) in Alumni Connect</h2>
    <p>
      The verification of Alumni Connect adhered strictly to the standard <strong>Software Testing Life Cycle (STLC)</strong>, a formal sequence of systematic testing phases designed to maximize defect detection efficiency and ensure requirement compliance. Figure 3.1 details the seven STLC phases executed across this project:
    </p>

    <div class="diagram-box">
      <div class="diagram-title">Figure 3.1: Software Testing Life Cycle (STLC) Phases Executed in Alumni Connect</div>
      <div class="stlc-flow">
        <div class="stlc-step"><strong>1. Requirement Analysis</strong><br/><span>Review FRs/NFRs, institutional email rules, RBAC matrix</span></div>
        <div class="stlc-arrow">&darr;</div>
        <div class="stlc-step"><strong>2. Test Planning</strong><br/><span>Draft IEEE 829 Test Plan, scope, resource allocation, schedule</span></div>
        <div class="stlc-arrow">&darr;</div>
        <div class="stlc-step"><strong>3. Test Case Design</strong><br/><span>Black-box EP/BVA, positive/negative scenarios, test data</span></div>
        <div class="stlc-arrow">&darr;</div>
        <div class="stlc-step"><strong>4. Test Environment Setup</strong><br/><span>Node.js v24, MongoDB Memory Server, Postman, Vite dev server</span></div>
        <div class="stlc-arrow">&darr;</div>
        <div class="stlc-step"><strong>5. Test Execution</strong><br/><span>Run automated suites, static audits, manual responsive tests</span></div>
        <div class="stlc-arrow">&darr;</div>
        <div class="stlc-step"><strong>6. Defect Reporting & Retesting</strong><br/><span>Log defects in Defect Tracker, root-cause triage, regression pass</span></div>
        <div class="stlc-arrow">&darr;</div>
        <div class="stlc-step"><strong>7. Test Closure & Sign-Off</strong><br/><span>Compute quality metrics, evaluate exit criteria, sign-off report</span></div>
      </div>
    </div>

    <h3>Detailed Phased Breakdown</h3>
    <ol>
      <li><strong>Requirement Analysis:</strong> The test team scrutinized functional requirements (FR-01 to FR-12) and non-functional requirements (NFR-01 to NFR-06) to identify testable conditions. Traceability mappings were established to verify that every requirement maps to at least one test case.</li>
      <li><strong>Test Planning:</strong> Authored the IEEE 829-compliant Test Plan defining testing objectives, risk matrices, entrance/exit criteria, and resource allocation.</li>
      <li><strong>Test-Case Design:</strong> Formulated detailed test specifications utilizing Equivalence Partitioning (EP), Boundary Value Analysis (BVA), and Error Guessing. Both positive and negative test cases were documented.</li>
      <li><strong>Test Environment Setup:</strong> Configured a hermetic testing environment featuring Node.js, an in-memory MongoDB server (<code>mongodb-memory-server</code>) to prevent test contamination of live databases, and isolated test configurations.</li>
      <li><strong>Test Execution:</strong> Automated regression suites (e.g., <code>testFontSelectorAndTypography.js</code>, <code>testSidebarControlsAndResponsiveness.js</code>, <code>auditUIThemeCompliance.js</code>) were executed alongside manual exploratory passes.</li>
      <li><strong>Defect Reporting & Tracking:</strong> Defects identified during testing were categorized by severity and priority, logged with step-by-step reproduction instructions, assigned for remediation, retested upon fix deployment, and confirmed via regression runs.</li>
      <li><strong>Test Closure:</strong> Generated execution summary reports, calculated Defect Removal Efficiency (DRE) and Test Pass Percentage (TPP), and prepared the final STQA documentation.</li>
    </ol>

    <h2>3.2 Verification versus Validation (The V-Model)</h2>
    <p>
      The V-Model represents the foundational relationship between each development development phase and its corresponding testing phase. In Alumni Connect, both Verification and Validation were conducted systematically:
    </p>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Attribute</th>
          <th>Verification ("Are we building the product right?")</th>
          <th>Validation ("Are we building the right product?")</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Definition</strong></td>
          <td>Static evaluation of software artifacts, designs, specifications, and code without program execution.</td>
          <td>Dynamic evaluation of the running software application to confirm satisfaction of customer/user needs.</td>
        </tr>
        <tr>
          <td><strong>Activities</strong></td>
          <td>Requirement reviews, architecture walkthroughs, code inspections, static token scanning.</td>
          <td>Executing functional test cases, API endpoint tests, UI usability testing, end-to-end integration runs.</td>
        </tr>
        <tr>
          <td><strong>Target in Project</strong></td>
          <td>Checking if Express routes enforce JWT middleware; auditing Tailwind config against approved color hexes.</td>
          <td>Confirming that students can successfully search alumni, receive mentorship guidance, and toggle themes.</td>
        </tr>
        <tr>
          <td><strong>Timing</strong></td>
          <td>Conducted continuously prior to and during code development.</td>
          <td>Conducted on executable code builds in staging and test environments.</td>
        </tr>
      </tbody>
    </table>

    <h2>3.3 Static versus Dynamic Testing</h2>
    <p>
      A balanced STQA methodology integrates both static and dynamic verification:
    </p>
    <ul>
      <li><strong>Static Testing in Alumni Connect:</strong>
        <ul>
          <li><em>Code Walkthroughs & Peer Reviews:</em> Manual peer review of Mongoose schemas, password hashing functions, and JWT authentication middleware.</li>
          <li><em>Automated Static Token Auditing:</em> Execution of <code>backend/scripts/auditUIThemeCompliance.js</code>, which parses 36 React JSX source files to scan for hardcoded hex values, arbitrary inline styles, and missing dark-mode contrast classes.</li>
          <li><em>Typography Linting:</em> Scripted regex inspection confirming zero unauthorized web font declarations (e.g., Google Fonts or Adobe Fonts) in global CSS or Tailwind configs.</li>
        </ul>
      </li>
      <li><strong>Dynamic Testing in Alumni Connect:</strong>
        <ul>
          <li><em>Automated API Endpoint Execution:</em> Sending HTTP POST/GET payloads via Supertest and Node.js test scripts to evaluate controller responses, status codes, and database mutations.</li>
          <li><em>Runtime Theme & Font Mutation:</em> Verifying that client-side DOM root class changes (<code>document.documentElement.classList.toggle('dark')</code>) and CSS custom property updates (<code>--app-font-family</code>) propagate instantaneously across all component subtrees.</li>
        </ul>
      </li>
    </ul>

    <h2>3.4 Black-Box versus White-Box Testing Strategies</h2>
    <h3>3.4.1 Black-Box Testing Techniques Applied</h3>
    <p>
      Black-box testing evaluates system behavior from an external perspective without knowledge of internal code logic:
    </p>
    <ol>
      <li><strong>Equivalence Class Partitioning (EP):</strong> Divides input domains into valid and invalid equivalence classes where all members are assumed to be processed identically:
        <ul>
          <li><em>Registration Email Field:</em>
            <ul>
              <li>Valid Class: String matching <code>^[a-zA-Z0-9._%+-]+@kkwagh\\.edu\\.in$</code> (e.g., <code>jkmahant370124@kkwagh.edu.in</code>).</li>
              <li>Invalid Class 1: Non-institutional domain (e.g., <code>user@gmail.com</code>).</li>
              <li>Invalid Class 2: Malformed email syntax (e.g., <code>user@kkwagh</code> or <code>@kkwagh.edu.in</code>).</li>
            </ul>
          </li>
        </ul>
      </li>
      <li><strong>Boundary Value Analysis (BVA):</strong> Evaluates system behavior at the exact boundaries of input ranges where software defects cluster:
        <ul>
          <li><em>Password Length Constraint (Minimum 6 characters):</em>
            <ul>
              <li>Boundary Test Values: Length 5 (Invalid, rejected), Length 6 (Valid boundary, accepted), Length 7 (Valid, accepted).</li>
            </ul>
          </li>
          <li><em>Graduation Year Constraint:</em>
            <ul>
              <li>Boundary Test Values: 1984 (KKWIEER establishment year &minus; 1, rejected), 1985 (Valid minimum), 2026 (Current year, valid), 2035 (Future limit + 5, rejected).</li>
            </ul>
          </li>
        </ul>
      </li>
      <li><strong>Decision Table Testing:</strong> Used to validate complex business logic with multiple logical conditions. For example, Alumni Directory Search Filtering:
        <table class="academic-table" style="font-size: 11px;">
          <thead><tr><th>Rule / Condition</th><th>R1</th><th>R2</th><th>R3</th><th>R4</th></tr></thead>
          <tbody>
            <tr><td>Alumni Registered</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td></tr>
            <tr><td>Admin Verification Approved</td><td>Yes</td><td>No</td><td>Yes</td><td>—</td></tr>
            <tr><td>Search Query Matches Name/Skill</td><td>Yes</td><td>Yes</td><td>No</td><td>—</td></tr>
            <tr><td><strong>Action: Display in Public Directory</strong></td><td><strong>YES</strong></td><td><strong>NO</strong></td><td><strong>NO</strong></td><td><strong>NO</strong></td></tr>
            <tr><td><strong>Action: Display Verified Badge</strong></td><td><strong>YES</strong></td><td><strong>NO</strong></td><td><strong>NO</strong></td><td><strong>NO</strong></td></tr>
          </tbody>
        </table>
      </li>
    </ol>

    <h3>3.4.2 White-Box Testing Techniques Applied</h3>
    <p>
      White-box testing inspects internal control structures, decision branches, and execution paths:
    </p>
    <ul>
      <li><strong>Statement & Branch Coverage:</strong> Testing the Express <code>protect</code> authentication middleware to confirm that all three logical branches are exercised: (1) Token absent $\rightarrow$ Return 401 Unauthorized; (2) Token invalid/expired $\rightarrow$ Return 401 Not Authorized; (3) Token valid $\rightarrow$ Call <code>next()</code>.</li>
      <li><strong>Cyclomatic Complexity ($V(G)$):</strong> Calculated for critical authentication functions using McCabe's metric $V(G) = E - N + 2P$, ensuring control structures remain below a complexity ceiling of 10 for high maintainability.</li>
    </ul>

    <h2>3.5 Manual versus Automated Testing</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Comparison Factor</th>
          <th>Manual Testing</th>
          <th>Automated Testing</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Execution Mode</strong></td>
          <td>Human tester manually interacting with browser UI and forms.</td>
          <td>Programmatic test scripts executing assertions via test runners.</td>
        </tr>
        <tr>
          <td><strong>Best Suited For</strong></td>
          <td>Exploratory testing, visual layout aesthetics, ad-hoc UX evaluations.</td>
          <td>Regression suites, continuous integration, repetitive API validation.</td>
        </tr>
        <tr>
          <td><strong>Speed & Frequency</strong></td>
          <td>Slow; requires human presence; prone to tester fatigue.</td>
          <td>Extremely fast; executes hundreds of assertions in seconds.</td>
        </tr>
        <tr>
          <td><strong>Application in Project</strong></td>
          <td>Evaluating mobile drawer UX, verifying keyboard tab order.</td>
          <td>Typography verification (8/8 pass), Sidebar verification (8/8 pass), Build checks.</td>
        </tr>
      </tbody>
    </table>

    <h2>3.6 Taxonomy of Testing Levels and Types</h2>
    <ul>
      <li><strong>Unit Testing:</strong> Testing individual functions in isolation (e.g., <code>applyFont</code>, <code>applyTheme</code>, password hashing utility).</li>
      <li><strong>Integration Testing:</strong> Verifying data interchange between modules (e.g., Express controllers reading from Mongoose models, JWT middleware communicating with route handlers).</li>
      <li><strong>System Testing:</strong> Validating the complete, integrated software application from end to end against specified requirements.</li>
      <li><strong>Regression Testing:</strong> Re-executing previously passed test suites following code modifications (such as moving the font selector to the sidebar bottom) to ensure zero unintended side effects.</li>
      <li><strong>Smoke Testing:</strong> Rapid build verification test suite checking that the server starts, the database connects, and the root HTML loads.</li>
      <li><strong>Sanity Testing:</strong> Focused subset of testing executed to verify that a specific bug fix (e.g., duplicate registration error message) works as expected.</li>
      <li><strong>Usability Testing:</strong> Evaluating the cognitive clarity, navigation ease, and accessibility of user workflows.</li>
      <li><strong>Compatibility Testing:</strong> Testing across Chrome, Edge, Safari, Firefox, and varied viewport widths (320px, 375px, 768px, 1024px, 1280px, 1440px).</li>
      <li><strong>Performance Testing:</strong> Benchmarking response latency, database query indexing, and frontend Vite bundle sizes.</li>
      <li><strong>Security Testing:</strong> Probing for NoSQL injection, XSS vulnerabilities, bcrypt hash validity, and unauthorized RBAC route escalation.</li>
    </ul>
  </div>
  `;
};
