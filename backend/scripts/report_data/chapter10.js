module.exports = function getChapter10(meta) {
  return `
  <!-- CHAPTER 10 -->
  <div class="page chapter-page">
    <div class="chapter-badge">Chapter 10</div>
    <h1 class="chapter-title">RESULTS, LIMITATIONS, AND FUTURE SCOPE</h1>
    <hr class="heading-rule" />

    <h2>10.1 Summary of Planned and Executed Testing</h2>
    <p>
      The comprehensive STQA evaluation of the Alumni Connect MERN platform incorporated rigorous static code analysis, unit test suites, integration test scripts, responsive layout simulations, and production build verifications. Across the test execution cycle:
    </p>
    <ul>
      <li><strong>60 Total Test Cases</strong> were formally specified across 11 functional and security modules (Modules A through K).</li>
      <li><strong>58 Test Cases</strong> were executed using automated Node.js test suites, Supertest harnesses, and browser developer tool suites.</li>
      <li><strong>58 Executed Test Cases PASSED</strong>, achieving a verified <strong>100.0% Test Pass Percentage (TPP)</strong> on the current release candidate.</li>
      <li><strong>2 Test Cases</strong> (profile picture S3 upload and rate-limiting brute force) remain categorized as <strong>Not Executed</strong>, slated for future cloud deployment cycles.</li>
      <li><strong>4 Real-World Defects</strong> (DEF-01 to DEF-04) were logged, isolated, patched, and verified closed with zero lingering regression side-effects.</li>
    </ul>

    <h2>10.2 Confirmed Results and Production Readiness</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>System Dimension</th>
          <th>Verified Functional State</th>
          <th>Testing Evidence</th>
          <th>Production Readiness</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Institutional Authentication</strong></td>
          <td>Gated to @kkwagh.edu.in emails; bcrypt 10 salt rounds; JWT Bearer transmission.</td>
          <td><code>testDuplicateRegistrationFlow.js</code>; TC-REG-01 to 07 passed.</td>
          <td><span class="status-pass">READY</span></td>
        </tr>
        <tr>
          <td><strong>Alumni Verification Security</strong></td>
          <td>Unverified alumni strictly quarantined on /pending-verification; hidden from directory.</td>
          <td>RBAC route guard tests; TC-DIR-05, TC-ADM-02 passed.</td>
          <td><span class="status-pass">READY</span></td>
        </tr>
        <tr>
          <td><strong>Typography Standardization</strong></td>
          <td>Only Arial, Helvetica, and Times New Roman permitted; zero rogue web fonts.</td>
          <td><code>testFontSelectorAndTypography.js</code> (8/8 assertions passed).</td>
          <td><span class="status-pass">READY</span></td>
        </tr>
        <tr>
          <td><strong>Sidebar UI Controls Placement</strong></td>
          <td>Font selector and square theme toggle anchored in horizontal row above user capsule.</td>
          <td><code>testSidebarControlsAndResponsiveness.js</code> (8/8 passed).</td>
          <td><span class="status-pass">READY</span></td>
        </tr>
        <tr>
          <td><strong>Theme & Color Compliance</strong></td>
          <td>10/10 WCAG 2.1 AA contrast pairs pass; Light/Dark themes persist via localStorage.</td>
          <td><code>auditUIThemeCompliance.js</code>; TC-UI-03, 04 passed.</td>
          <td><span class="status-pass">READY</span></td>
        </tr>
        <tr>
          <td><strong>Production Asset Bundling</strong></td>
          <td>Vite build transforms 1,698 modules cleanly; 79kB CSS, 615kB JS minified.</td>
          <td><code>npm --prefix frontend run build</code> (built in 38.66s, 0 errors).</td>
          <td><span class="status-pass">READY</span></td>
        </tr>
      </tbody>
    </table>

    <h2>10.3 Known Limitations</h2>
    <p>
      While the application exhibits high functional stability, the following technical limitations must be acknowledged:
    </p>
    <ol>
      <li><strong>Local Development Mailer:</strong> The current email notification service operates via local simulation and development Nodemailer transports. Under production deployment, a dedicated institutional SMTP relay (e.g., SendGrid, AWS SES) with DKIM/SPF DNS records must be configured.</li>
      <li><strong>WebSocket Concurrency Ceiling:</strong> Real-time Socket.IO synchronization is configured for single-node in-memory adapter execution. Scaling to thousands of simultaneous campus users will necessitate a distributed Redis pub/sub adapter.</li>
      <li><strong>Single Institutional Domain Constraint:</strong> The current regex validation explicitly locks registration to <code>@kkwagh.edu.in</code>. Extending the platform to partner colleges or alumni with legacy domains will require an administrative domain whitelist table.</li>
    </ol>

    <h2>10.4 Unverified Functionality</h2>
    <p>
      In accordance with academic integrity guidelines, the following capabilities have not yet undergone automated regression verification:
    </p>
    <ul>
      <li>High-volume concurrent stress testing exceeding 1,000 parallel virtual users.</li>
      <li>Multi-year database archiving tests simulating 50,000 alumni records.</li>
      <li>Direct integration with third-party institutional ERP systems (e.g., college student information databases).</li>
    </ul>

    <h2>10.5 Future Scope and Roadmap</h2>
    <p>
      The architectural foundation established during this project enables several advanced technical extensions:
    </p>
    <ul>
      <li><strong>End-to-End Playwright / Cypress Visual Regression:</strong> Implementing automated pixel-diffing tests to detect accidental layout or color shifts across major releases.</li>
      <li><strong>Automated OWASP ZAP Security Scanning:</strong> Integrating dynamic application security testing (DAST) into the GitHub Actions CI/CD pipeline to continuously scan for API vulnerabilities.</li>
      <li><strong>AI-Driven Career Guidance Matching:</strong> Implementing vector embeddings and cosine similarity search to intelligently match undergraduate capstone interests with alumni professional trajectories.</li>
      <li><strong>Mobile Application Packaging:</strong> Utilizing Capacitor or React Native to wrap the responsive web frontend into native Android/iOS mobile application binaries.</li>
    </ul>

    <h2>10.6 Recommendations for Long-Term Software Quality</h2>
    <p>
      To sustain high software quality throughout the multi-year lifecycle of Alumni Connect, the following engineering guidelines are recommended:
    </p>
    <ol>
      <li><strong>Mandatory Pre-Commit Hooks:</strong> Enforce git hooks via Husky that automatically run <code>testFontSelectorAndTypography.js</code> and <code>testSidebarControlsAndResponsiveness.js</code> before allowing any git commit.</li>
      <li><strong>Strict Design Token Discipline:</strong> Reject any pull request that introduces arbitrary raw Tailwind utilities (e.g., <code>text-[#123456]</code>) or unsupported fonts outside the design system.</li>
      <li><strong>Continuous Dependency Auditing:</strong> Run <code>npm audit</code> monthly to detect and patch vulnerabilities in underlying npm packages (Mongoose, Express, Vite, etc.).</li>
    </ol>
  </div>
  `;
};
