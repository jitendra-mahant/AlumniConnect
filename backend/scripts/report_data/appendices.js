module.exports = function getAppendices(meta) {
  return `
  <!-- CONCLUSION -->
  <div class="page chapter-page">
    <div class="chapter-badge">Final Section</div>
    <h1 class="chapter-title">CONCLUSION</h1>
    <hr class="heading-rule" />
    <p>
      The engineering and quality assurance lifecycle of the <strong>Alumni Connect</strong> platform exemplifies the vital role of systematic Software Testing and Quality Assurance in modern full-stack web engineering. Developed specifically for K. K. Wagh Institute of Engineering Education & Research (KKWIEER), Nashik, the application was transformed from an ambitious concept into a robust, secure, and accessible platform through the disciplined execution of the Software Testing Life Cycle (STLC).
    </p>
    <p>
      By implementing an IEEE 829-compliant Master Test Plan, creating over 60 detailed test cases across 11 critical modules, and engineering automated Node.js verification harnesses, the project demonstrated that quality is not an afterthought appended at the end of development, but a continuous engineering discipline embedded within every phase. The rigorous static analysis of UI tokens, automated verification of font standardization, and thorough testing of role-based security guards ensure that the platform delivers dependable performance, institutional trust, and an exceptional user experience across all devices.
    </p>
    <p>
      In conclusion, Alumni Connect establishes an authenticated, engaging, and scalable digital ecosystem for the KKWIEER community, while the STQA methodologies documented in this report provide a comprehensive model for engineering high-integrity web applications in Computer Engineering.
    </p>

    <!-- REFERENCES -->
    <h2 class="academic-subheading" style="margin-top: 40px;">REFERENCES AND BIBLIOGRAPHY</h2>
    <hr class="heading-rule" />
    <ol class="references-list">
      <li>IEEE Standard for Software and System Test Documentation, <em>IEEE Std 829-2008</em>, IEEE Computer Society, 2008.</li>
      <li>ISO/IEC 25010:2011, <em>Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models</em>, International Organization for Standardization, Geneva, Switzerland.</li>
      <li>P. C. Jorgensen, <em>Software Testing: A Craftsman's Approach</em>, 4th ed., Boca Raton, FL: CRC Press, 2013.</li>
      <li>R. S. Pressman and B. R. Maxim, <em>Software Engineering: A Practitioner's Approach</em>, 9th ed., New York, NY: McGraw-Hill Education, 2020.</li>
      <li>B. Beizer, <em>Software Testing Techniques</em>, 2nd ed., Boston, MA: International Thomson Computer Press, 1990.</li>
      <li>G. J. Myers, T. Badgett, and C. Sandler, <em>The Art of Software Testing</em>, 3rd ed., Hoboken, NJ: John Wiley & Sons, 2011.</li>
      <li>OWASP Foundation, <em>OWASP Top 10 Web Application Security Risks</em>, 2021. [Online]. Available: https://owasp.org/www-project-top-ten/</li>
      <li>World Wide Web Consortium (W3C), <em>Web Content Accessibility Guidelines (WCAG) 2.1</em>, W3C Recommendation, June 2018. [Online]. Available: https://www.w3.org/TR/WCAG21/</li>
      <li>M. Fowler, <em>Refactoring: Improving the Design of Existing Code</em>, 2nd ed., Boston, MA: Addison-Wesley, 2018.</li>
      <li>B. Boehm, <em>Software Engineering Economics</em>, Englewood Cliffs, NJ: Prentice-Hall, 1981.</li>
    </ol>
  </div>

  <!-- APPENDIX A -->
  <div class="page chapter-page">
    <div class="chapter-badge">Appendix A</div>
    <h1 class="chapter-title">REQUIREMENTS TRACEABILITY MATRIX (RTM)</h1>
    <hr class="heading-rule" />
    <p>
      The Requirements Traceability Matrix establishes a bidirectional link between documented functional requirements and corresponding verification test cases, guaranteeing zero untested requirements:
    </p>
    <table class="academic-table" style="font-size: 11px;">
      <thead>
        <tr>
          <th>Requirement ID</th>
          <th>Requirement Description</th>
          <th>Associated Test Case IDs</th>
          <th>Verification Method</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>FR-01</td><td>Institutional Email Registration</td><td>TC-REG-01, TC-REG-03, TC-REG-04</td><td>Automated API Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-02</td><td>JWT-based Secure Login</td><td>TC-AUTH-01, TC-AUTH-02, TC-AUTH-03</td><td>Automated Supertest</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-03</td><td>bcrypt Password Salt Hashing</td><td>TC-REG-01, TC-SEC-01</td><td>Mongoose Schema Audit</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-04</td><td>Alumni Profile Management</td><td>TC-PROF-01, TC-PROF-02, TC-PROF-04</td><td>API & UI Form Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-05</td><td>Alumni Search and Directory</td><td>TC-DIR-01, TC-DIR-02, TC-DIR-05</td><td>Automated Query Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-06</td><td>Admin Verification Queue</td><td>TC-ADM-01, TC-ADM-02, TC-DIR-05</td><td>RBAC Controller Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-07</td><td>Connection Request Workflow</td><td>TC-CON-01, TC-CON-02, TC-CON-03</td><td>Integration Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-08</td><td>Mentorship Guidance Scheduling</td><td>TC-CON-04</td><td>Controller & Form Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-09</td><td>Job Opportunities Board</td><td>TC-JOB-01, TC-JOB-02, TC-JOB-03</td><td>Role Access Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-10</td><td>Real-Time Notification System</td><td>TC-MSG-04</td><td>Socket Event Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-11</td><td>Admin Password Recovery Flow</td><td>TC-AUTH-02, TC-ADM-01</td><td>Controller & UI Test</td><td><span class="status-pass">Covered</span></td></tr>
        <tr><td>FR-12</td><td>Dynamic Typography & Theme Toggle</td><td>TC-UI-01, TC-UI-02, TC-UI-03, TC-UI-04</td><td>Automated Script (8/8)</td><td><span class="status-pass">Covered</span></td></tr>
      </tbody>
    </table>
  </div>

  <!-- APPENDIX B -->
  <div class="page chapter-page">
    <div class="chapter-badge">Appendix B</div>
    <h1 class="chapter-title">SAMPLE DEFECT REPORT TEMPLATE</h1>
    <hr class="heading-rule" />
    <table class="academic-table" style="font-size: 11px;">
      <tbody>
        <tr><td><strong>Defect ID:</strong></td><td><code>DEF-[MODULE]-[NUMBER]</code> (e.g., DEF-AUTH-004)</td></tr>
        <tr><td><strong>Defect Title:</strong></td><td>Concise one-line summary of observed failure</td></tr>
        <tr><td><strong>Module / Subsystem:</strong></td><td>Specific component or page (e.g., frontend/src/pages/Jobs.jsx)</td></tr>
        <tr><td><strong>Severity:</strong></td><td>[Critical / High / Medium / Low]</td></tr>
        <tr><td><strong>Priority:</strong></td><td>[P1 - Blocker / P2 - High / P3 - Medium / P4 - Low]</td></tr>
        <tr><td><strong>Reported By & Date:</strong></td><td>Tester Name & Date of Execution</td></tr>
        <tr><td><strong>Environment:</strong></td><td>OS, Browser version, Node.js version, Git Commit Hash</td></tr>
        <tr><td><strong>Prerequisites:</strong></td><td>System conditions required prior to reproduction</td></tr>
        <tr><td><strong>Steps to Reproduce (S2R):</strong></td><td>
          1. Navigate to target URL.<br/>
          2. Enter specified input payload.<br/>
          3. Trigger action button.<br/>
          4. Observe resulting error state.
        </td></tr>
        <tr><td><strong>Expected Result:</strong></td><td>System behavior matching functional requirement specification</td></tr>
        <tr><td><strong>Actual Result:</strong></td><td>Exact error message, HTTP status code, or visual anomaly observed</td></tr>
        <tr><td><strong>Terminal / Console Log:</strong></td><td>Paste stack trace or CLI error message</td></tr>
        <tr><td><strong>Status:</strong></td><td>[New / Assigned / Open / Fixed / Retest / Closed / Deferred]</td></tr>
      </tbody>
    </table>
  </div>

  <!-- APPENDIX C -->
  <div class="page chapter-page">
    <div class="chapter-badge">Appendix C</div>
    <h1 class="chapter-title">SAMPLE REST API TEST SCENARIOS</h1>
    <hr class="heading-rule" />
    <p>
      Representative <code>curl</code> test commands and JSON payloads utilized during automated API verification:
    </p>

    <div class="code-snippet-box">
      <strong>1. Test Valid Student Registration Endpoint (POST /api/auth/register):</strong>
      <pre>
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jitendra Mahant",
    "email": "jkmahant370124@kkwagh.edu.in",
    "password": "Student@Pass123",
    "role": "student"
  }'</pre>
      <em>Expected Output: HTTP 201 Created with JSON body containing user ID and signed JWT token.</em>
    </div>

    <div class="code-snippet-box">
      <strong>2. Test Duplicate Email Prevention (POST /api/auth/register with existing email):</strong>
      <pre>
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jitendra Mahant Duplicate",
    "email": "JKMAHANT370124@KKWAGH.EDU.IN",
    "password": "AnyPassword123",
    "role": "alumni"
  }'</pre>
      <em>Expected Output: HTTP 400 Bad Request with "An account with this institutional email already exists. Please log in or reset your password."</em>
    </div>

    <div class="code-snippet-box">
      <strong>3. Test Protected Alumni Directory Endpoint (GET /api/alumni):</strong>
      <pre>
curl -X GET http://localhost:5000/api/alumni \\
  -H "Authorization: Bearer &lt;VALID_JWT_TOKEN&gt;"</pre>
      <em>Expected Output: HTTP 200 OK with array of verified alumni profiles (unverified alumni filtered out).</em>
    </div>
  </div>

  <!-- APPENDIX D & E -->
  <div class="page chapter-page">
    <div class="chapter-badge">Appendix D & E</div>
    <h1 class="chapter-title">TEST EXECUTION RECORD & GLOSSARY</h1>
    <hr class="heading-rule" />

    <h2>Appendix D: Test Execution Record & Sign-Off Template</h2>
    <table class="academic-table" style="font-size: 11px;">
      <thead>
        <tr>
          <th>Execution Cycle</th>
          <th>Test Suite Name</th>
          <th>Total Cases</th>
          <th>Pass</th>
          <th>Fail</th>
          <th>Executed By</th>
          <th>Verified By Guide</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Cycle 1 (Alpha)</td><td>Typography Verification</td><td>8</td><td>8</td><td>0</td><td>Jitendra Mahant</td><td>Prof. N. S. Pagare</td></tr>
        <tr><td>Cycle 2 (Beta)</td><td>Sidebar Placement & Viewports</td><td>8</td><td>8</td><td>0</td><td>Jitendra Mahant</td><td>Prof. N. S. Pagare</td></tr>
        <tr><td>Cycle 3 (Gamma)</td><td>Static UI Theme & WCAG Audit</td><td>10</td><td>10</td><td>0</td><td>Jitendra Mahant</td><td>Prof. N. S. Pagare</td></tr>
        <tr><td>Cycle 4 (Final)</td><td>Full Production Rollup Build</td><td>1</td><td>1</td><td>0</td><td>Jitendra Mahant</td><td>Prof. N. S. Pagare</td></tr>
      </tbody>
    </table>

    <h2>Appendix E: Comprehensive Glossary of STQA Terminology</h2>
    <dl class="glossary-list">
      <dt><strong>BVA (Boundary Value Analysis):</strong></dt>
      <dd>A black-box test design technique in which test cases are designed based on boundary values.</dd>
      <dt><strong>Cyclomatic Complexity:</strong></dt>
      <dd>A structural software metric that measures the number of linearly independent paths through a program's source code.</dd>
      <dt><strong>Defect Density:</strong></dt>
      <dd>The ratio of confirmed software defects relative to the size of the software module, usually expressed per KLOC.</dd>
      <dt><strong>EP (Equivalence Partitioning):</strong></dt>
      <dd>A black-box testing method that divides the input domain into partitions of data from which test cases can be derived.</dd>
      <dt><strong>FOUC / FOFT:</strong></dt>
      <dd>Flash of Unstyled Content / Flash of Faux Text occurring during client-side hydration before theme stylesheets initialize.</dd>
      <dt><strong>JWT (JSON Web Token):</strong></dt>
      <dd>A compact, URL-safe means of representing claims to be transferred between two parties, signed with a cryptographic key.</dd>
      <dt><strong>RACI Matrix:</strong></dt>
      <dd>A responsibility assignment matrix mapping roles across Responsible, Accountable, Consulted, and Informed.</dd>
      <dt><strong>RTM (Requirements Traceability Matrix):</strong></dt>
      <dd>A grid document linking user requirements with their corresponding test cases to verify test coverage.</dd>
      <dt><strong>STLC (Software Testing Life Cycle):</strong></dt>
      <dd>A structured sequence of activities conducted by the testing team to ensure software quality requirements are fulfilled.</dd>
      <dt><strong>WCAG 2.1 AA:</strong></dt>
      <dd>Web Content Accessibility Guidelines Level Double-A standard requiring minimum 4.5:1 text contrast for accessible design.</dd>
    </dl>
  </div>
  `;
};
