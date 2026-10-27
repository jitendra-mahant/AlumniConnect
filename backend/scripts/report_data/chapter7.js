module.exports = function getChapter7(meta) {
  return `
  <!-- CHAPTER 7 -->
  <div class="page chapter-page">
    <div class="chapter-badge">Chapter 7</div>
    <h1 class="chapter-title">AUTOMATION AND TESTING TOOLS</h1>
    <hr class="heading-rule" />

    <h2>7.1 Automated Testing Architecture for the MERN Stack</h2>
    <p>
      In modern agile software engineering, automated testing is critical to sustain code velocity while preventing regressions. For the MERN stack of Alumni Connect, the automated testing architecture is organized across three integrated strata:
    </p>
    <ol>
      <li><strong>Static Analysis & Token Auditing Layer:</strong> Programmatic parsers that evaluate ASTs, CSS variables, and JSX token declarations without executing code.</li>
      <li><strong>Isolated In-Memory Backend Integration Layer:</strong> Test runners that instantiate transient, isolated database instances via <code>mongodb-memory-server</code>, execute Express request pipelines using Supertest, and verify responses deterministically.</li>
      <li><strong>DOM Mutation & Layout Assertion Layer:</strong> Automated verification scripts that evaluate responsive class bindings, local storage event listeners, and DOM root attributes across emulated breakpoints.</li>
    </ol>

    <h2>7.2 Tools Selection, Purpose, and Setup</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Tool / Framework</th>
          <th>Classification</th>
          <th>Core Purpose in Alumni Connect</th>
          <th>Configuration File / Command</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Node.js Native Test Assert</strong></td>
          <td>Assertion Library</td>
          <td>Executes strict invariant checks (<code>assert.strictEqual</code>, <code>assert.ok</code>) in test scripts.</td>
          <td><code>const assert = require('assert')</code></td>
        </tr>
        <tr>
          <td><strong>MongoDB Memory Server</strong></td>
          <td>Database Test Harness</td>
          <td>Spins up an ephemeral, in-memory MongoDB daemon to test Mongoose queries without local DB dependencies.</td>
          <td><code>mongodb-memory-server@10.1.2</code></td>
        </tr>
        <tr>
          <td><strong>Supertest</strong></td>
          <td>HTTP Integration Testing</td>
          <td>Simulates HTTP POST/GET/PUT requests directly against the Express app instance without binding to network ports.</td>
          <td><code>request(app).post('/api/auth/login')</code></td>
        </tr>
        <tr>
          <td><strong>Postman Desktop</strong></td>
          <td>Manual API Exploration</td>
          <td>Used during early development to construct and test collections with environment variables (<code>{{token}}</code>).</td>
          <td>Postman Collection v2.1 export</td>
        </tr>
        <tr>
          <td><strong>Vite Production Bundler</strong></td>
          <td>Build Verification & Lint</td>
          <td>Rollup-based tree-shaking and minification audit to detect circular dependencies and syntax errors.</td>
          <td><code>npm --prefix frontend run build</code></td>
        </tr>
        <tr>
          <td><strong>Browser Developer Tools</strong></td>
          <td>Visual & Network Debug</td>
          <td>Chrome DevTools for responsive device emulation (320px–1440px), network throttling, and DOM inspection.</td>
          <td>Device Mode / Network Tab</td>
        </tr>
      </tbody>
    </table>

    <h2>7.3 Project Test Scripts Walkthrough and Assertions</h2>
    <p>
      The repository contains purpose-built automated verification scripts in <code>backend/scripts/</code>:
    </p>

    <h3>7.3.1 Typography Verification Script (<code>testFontSelectorAndTypography.js</code>)</h3>
    <p>
      This script enforces strict typography rules across the codebase:
    </p>
    <div class="code-snippet-box">
      <strong>Key Assertions in testFontSelectorAndTypography.js:</strong>
      <pre>
it('1. Exact permitted font definitions are mapped in theme.js', () => {
  assert(themeJs.includes("id: 'arial'"));
  assert(themeJs.includes("value: 'Arial, Helvetica, sans-serif'"));
  assert(themeJs.includes("id: 'helvetica'"));
  assert(themeJs.includes("value: 'Helvetica, Arial, sans-serif'"));
  assert(themeJs.includes("id: 'times'"));
  assert(themeJs.includes("value: \"'Times New Roman', Times, serif\""));
});
it('2. --app-font-family is defined as single source of truth', () => {
  assert(themeJs.includes("--app-font-family'"));
  assert(themeJs.includes("localStorage.setItem('alumniconnect_font'"));
});
it('8. Zero unauthorized external web fonts in CSS or configuration', () => {
  const disallowed = ['inter', 'roboto', 'poppins', 'montserrat', 'open sans', 'lato'];
  for (const font of disallowed) {
    assert(!allContent.includes('"' + font + '"'));
  }
});</pre>
    </div>
    <p><strong>Execution Outcome:</strong> 8 Passed, 0 Failed (100% pass rate).</p>

    <h3>7.3.2 Sidebar Controls & Responsiveness Script (<code>testSidebarControlsAndResponsiveness.js</code>)</h3>
    <p>
      This script verifies the exact placement and layout of the bottom sidebar controls:
    </p>
    <div class="code-snippet-box">
      <strong>Key Assertions in testSidebarControlsAndResponsiveness.js:</strong>
      <pre>
it('1. Desktop sidebar anchors controls in bottom section above user profile card', () => {
  assert(layoutSrc.includes('&lt;aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0'));
  assert(layoutSrc.includes('&lt;nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"'));
  const toolbarPos = layoutSrc.indexOf('&lt;ThemeFontToolbar className="w-full" dropUp={true} /&gt;');
  const profilePos = layoutSrc.indexOf('{/* User Profile Capsule */}', toolbarPos);
  assert(toolbarPos !== -1 &amp;&amp; profilePos !== -1 &amp;&amp; toolbarPos &lt; profilePos);
});
it('2. Font selector and theme toggle share the same horizontal row with proper sizing', () => {
  assert(toolbarSrc.includes('flex items-center gap-2'));
  assert(toolbarSrc.includes('relative flex-1 min-w-0'));
  assert(toolbarSrc.includes('flex h-9 w-9 shrink-0 items-center justify-center'));
});</pre>
    </div>
    <p><strong>Execution Outcome:</strong> 8 Passed, 0 Failed (100% pass rate).</p>

    <h3>7.3.3 UI Theme Compliance Auditor (<code>auditUIThemeCompliance.js</code>)</h3>
    <p>
      An automated static analysis scanner that parses 36 React component source files, token mappings, and computes WCAG contrast ratios:
    </p>
    <ul>
      <li>Scanned 36 frontend modules; validated 22/22 approved Tailwind brand and ink tokens.</li>
      <li>Computed 10 core WCAG contrast pairs; confirmed 10/10 meet or exceed 4.5:1 (normal text) and 3.0:1 (UI actions).</li>
      <li>Identified residual legacy <code>navy-*</code> classes and raw <code>teal-*</code> utility instances, generating a structured remediation roadmap.</li>
    </ul>

    <h2>7.4 Test Execution Instructions and Command Reference</h2>
    <p>
      To reproduce and execute the test suites directly on the Alumni Connect project:
    </p>
    <div class="code-snippet-box">
      <pre>
# 1. Run the Font Selector and Typography Verification Suite
node backend/scripts/testFontSelectorAndTypography.js

# 2. Run the Sidebar Controls Placement & Responsiveness Suite
node backend/scripts/testSidebarControlsAndResponsiveness.js

# 3. Run the Comprehensive UI Theme Compliance and Contrast Audit
node backend/scripts/auditUIThemeCompliance.js

# 4. Verify Frontend Production Build and Asset Bundling
npm --prefix frontend run build</pre>
    </div>

    <h2>7.5 Continuous Integration (CI) Blueprint</h2>
    <p>
      To maintain code quality across future student development teams, an automated GitHub Actions CI workflow (<code>.github/workflows/stqa-ci.yml</code>) is defined:
    </p>
    <div class="code-snippet-box">
      <pre>
name: AlumniConnect STQA Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm --prefix frontend install
      - run: npm --prefix backend install
      - name: Execute Typography & Placement Verification
        run: |
          node backend/scripts/testFontSelectorAndTypography.js
          node backend/scripts/testSidebarControlsAndResponsiveness.js
          node backend/scripts/auditUIThemeCompliance.js
      - name: Verify Frontend Production Build
        run: npm --prefix frontend run build</pre>
    </div>
  </div>
  `;
};
