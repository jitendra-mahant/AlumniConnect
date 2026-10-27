module.exports = function getChapter6(meta) {
  return `
  <!-- CHAPTER 6 -->
  <div class="page chapter-page">
    <div class="chapter-badge">Chapter 6</div>
    <h1 class="chapter-title">TEST EXECUTION AND RESULTS</h1>
    <hr class="heading-rule" />

    <h2>6.1 Test Execution Procedure and Protocol</h2>
    <p>
      Test execution followed a formal, repeatable protocol across both automated test scripts and interactive manual sessions:
    </p>
    <ol>
      <li><strong>Pre-Execution Verification:</strong> The testing environment was validated to ensure Node.js v24, MongoDB Memory Server / local daemon, and Vite development instances were cleanly initialized without lingering background processes.</li>
      <li><strong>Test Execution Sequencing:</strong> Tests were executed in increasing order of complexity:
        <ul>
          <li><em>Step 1:</em> Static source code audits (theme tokens, CSS variables, typography).</li>
          <li><em>Step 2:</em> Unit and crypto utility tests (bcrypt salt rounds, JWT signing).</li>
          <li><em>Step 3:</em> API route and integration tests (Supertest execution against in-memory DB).</li>
          <li><em>Step 4:</em> Layout, responsive viewports, and DOM mutation tests.</li>
          <li><em>Step 5:</em> Production build verification (<code>npm run build</code>).</li>
        </ul>
      </li>
      <li><strong>Evidence Logging:</strong> Every automated assertion was logged to the standard console output with timestamped exit codes and execution runtimes.</li>
    </ol>

    <h2>6.2 Test Result Recording and Evidence Capture</h2>
    <p>
      Test evidence was captured using two complementary mechanisms:
    </p>
    <ul>
      <li><strong>Automated CLI Test Transcripts:</strong> Node.js test runners output structured PASS/FAIL summaries with exact assertion messages (e.g., <code>[PASS] 1. Exact permitted font definitions are mapped in theme.js</code>).</li>
      <li><strong>Static Audit Metrics Transcripts:</strong> The static theme compliance auditor generated full text reports detailing exact line numbers, raw Tailwind utility counts, WCAG contrast ratios, and token mapping matches.</li>
    </ul>

    <h2>6.3 Expected versus Actual Results Analysis</h2>
    <p>
      During the initial test cycles, the majority of core backend and database operations matched expected specifications cleanly. However, static testing and UI theme audits unmasked subtle runtime visual and semantic deviations that traditional unit tests failed to detect:
    </p>
    <ul>
      <li><em>Expected:</em> Verified Alumni badges and positive connection statuses must utilize semantic emerald success colors (<code>emerald-600</code> text, <code>emerald-500/15</code> background) to distinguish them from primary actions.
      <br/><em>Actual Discovered:</em> Verified badges were using brand teal (<code>bg-teal-50 text-teal-700</code>), violating the design system rule that semantic success must not be substituted with brand teal.</li>
      <li><em>Expected:</em> Opportunity type badges on the job board must adapt cleanly to dark mode.
      <br/><em>Actual Discovered:</em> Badges in <code>Jobs.jsx</code> lacked <code>dark:</code> classes, rendering stark white pastel boxes against dark card surfaces.</li>
      <li><em>Expected:</em> Selecting a font in the font dropdown must alter the application typography.
      <br/><em>Actual Discovered:</em> Early versions stored the selected font in local storage but lacked the active binding to <code>--app-font-family</code> and Tailwind sans/display utilities, resulting in no visual change.</li>
    </ul>

    <h2>6.4 Pass/Fail Criteria and Quality Thresholds</h2>
    <p>
      An individual test case was awarded a <strong>PASS</strong> status if and only if the observed actual outcome matched the expected result exactly with zero unhandled exceptions, zero data corruption, and complete compliance with stated requirements. If any discrepancy occurred—even minor visual contrast drops—the test was marked <strong>FAIL</strong> and logged as a defect.
    </p>

    <h2>6.5 Defect Severity and Priority Categorization</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Classification</th>
          <th>Severity (Technical Impact on System)</th>
          <th>Priority (Urgency of Business Remediation)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Critical (P1)</strong></td>
          <td>Complete system crash, data loss, security bypass, or inability to log in / register.</td>
          <td>Fix immediately; blocks further testing or release (turnaround &lt; 24h).</td>
        </tr>
        <tr>
          <td><strong>High (P2)</strong></td>
          <td>Major feature failure with no workaround; access control flaw; missing dark mode styling.</td>
          <td>Fix before any milestone or beta release (turnaround 24–48h).</td>
        </tr>
        <tr>
          <td><strong>Medium (P3)</strong></td>
          <td>Non-critical functional flaw; minor layout discrepancy; raw utility proliferation.</td>
          <td>Fix during standard refactoring iteration.</td>
        </tr>
        <tr>
          <td><strong>Low (P4)</strong></td>
          <td>Cosmetic flaw, minor typo, missing scrollbar styling, slight padding imbalance.</td>
          <td>Fix when time permits or during final polish pass.</td>
        </tr>
      </tbody>
    </table>

    <h2>6.6 Defect Life Cycle State Machine</h2>
    <div class="diagram-box">
      <div class="diagram-title">Figure 6.1: Defect Life Cycle Followed in Alumni Connect</div>
      <p style="text-align: center; font-family: monospace; font-size: 13px; line-height: 1.8;">
        [ NEW ] &rarr; (Triage & Validation) &rarr; [ ASSIGNED ]<br/>
        &darr;<br/>
        [ OPEN / IN PROGRESS ] &rarr; (Code Patch Applied) &rarr; [ FIXED ]<br/>
        &darr;<br/>
        [ RETEST / REGRESSION ] &rarr; (Verified Fixed?)<br/>
        &bull; YES &rarr; [ CLOSED ]<br/>
        &bull; NO &rarr; [ REOPENED ] &rarr; [ ASSIGNED ]
      </p>
    </div>

    <h2>6.7 Sample Real-World Defect Reports</h2>

    <div class="defect-card">
      <div class="defect-header">
        <span class="defect-id">DEF-01</span>
        <span class="defect-title">Semantic Status Color Violation: Brand Teal Substituted for Emerald in Verified Badges</span>
        <span class="defect-badge-high">High / P2</span>
      </div>
      <table class="defect-meta-table">
        <tr><td><strong>Module:</strong> Shared UI (ui.jsx)</td><td><strong>Reported By:</strong> Jitendra Mahant</td><td><strong>Date:</strong> Oct 24, 2026</td></tr>
        <tr><td><strong>Environment:</strong> React 18, Tailwind CSS v3.4</td><td><strong>Status:</strong> CLOSED (Verified)</td><td><strong>Target Fix:</strong> ui.jsx:97</td></tr>
      </table>
      <p><strong>Description:</strong> <code>VerifiedBadge</code> and <code>STATUS_STYLES</code> (accepted, verified, active) were implemented using <code>bg-teal-50 text-teal-700</code> and <code>dark:bg-teal-950/40 dark:text-teal-300</code> instead of semantic emerald tokens.</p>
      <p><strong>Root Cause:</strong> Early UI developers conflated the primary brand accent (Teal) with semantic positive status indicators.</p>
      <p><strong>Remediation:</strong> Updated styling classes to <code>bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300</code>.</p>
      <p><strong>Retest Result:</strong> Verified; semantic green styling distinguishes verified alumni from primary teal buttons.</p>
    </div>

    <div class="defect-card">
      <div class="defect-header">
        <span class="defect-id">DEF-02</span>
        <span class="defect-title">Missing Dark Mode Classes on Opportunity Type Badges in Jobs Board</span>
        <span class="defect-badge-high">High / P2</span>
      </div>
      <table class="defect-meta-table">
        <tr><td><strong>Module:</strong> Jobs Page (Jobs.jsx)</td><td><strong>Reported By:</strong> Jitendra Mahant</td><td><strong>Date:</strong> Oct 24, 2026</td></tr>
        <tr><td><strong>Environment:</strong> Dark Theme Enabled</td><td><strong>Status:</strong> CLOSED (Verified)</td><td><strong>Target Fix:</strong> Jobs.jsx:38-44</td></tr>
      </table>
      <p><strong>Description:</strong> Opportunity badges (<code>internship</code>, <code>full-time</code>, <code>workMode</code>) had only light mode background utilities (<code>bg-violet-50 text-violet-700</code>, <code>bg-blue-50 text-blue-700</code>) without dark counterparts.</p>
      <p><strong>Visual Impact:</strong> In Dark mode, badges rendered as bright pastel rectangular blocks against <code>#0f172a</code> cards, breaking dark visual hierarchy.</p>
      <p><strong>Remediation:</strong> Added paired dark utilities (<code>dark:bg-violet-950/40 dark:text-violet-300</code>, <code>dark:bg-blue-950/40 dark:text-blue-300</code>).</p>
      <p><strong>Retest Result:</strong> Verified; badges adapt cleanly to dark theme.</p>
    </div>

    <div class="defect-card">
      <div class="defect-header">
        <span class="defect-id">DEF-03</span>
        <span class="defect-title">Font Selector Choice Stored in LocalStorage but Not Updating Typography</span>
        <span class="defect-badge-high">High / P1</span>
      </div>
      <table class="defect-meta-table">
        <tr><td><strong>Module:</strong> Theme Engine (theme.js / ThemeFontToolbar.jsx)</td><td><strong>Reported By:</strong> Jitendra Mahant</td><td><strong>Date:</strong> Oct 23, 2026</td></tr>
        <tr><td><strong>Environment:</strong> All Browsers</td><td><strong>Status:</strong> CLOSED (Verified)</td><td><strong>Target Fix:</strong> index.css & theme.js</td></tr>
      </table>
      <p><strong>Description:</strong> Selecting Helvetica or Times New Roman updated the select dropdown display, but the application font remained Arial.</p>
      <p><strong>Root Cause:</strong> Global CSS rules in <code>index.css</code> had a hardcoded font stack on <code>body</code> and <code>h1-h6</code>, bypassing the CSS custom property <code>--app-font-family</code>.</p>
      <p><strong>Remediation:</strong> Bound <code>html</code>, <code>body</code>, and <code>headings</code> in <code>index.css</code> and Tailwind <code>sans/display</code> configs strictly to <code>var(--app-font-family)</code>.</p>
      <p><strong>Retest Result:</strong> Verified via <code>testFontSelectorAndTypography.js</code>; 8/8 test assertions pass.</p>
    </div>

    <h2>6.8 Retesting and Regression Testing Outcomes</h2>
    <p>
      Following the deployment of fixes for DEF-01, DEF-02, and DEF-03, complete regression suites were executed. Zero regressions were observed. The production Vite build compiled in 38.66 seconds with zero errors.
    </p>

    <h2>6.9 Summary Table of Test Execution Status</h2>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Module Code & Name</th>
          <th>Total Planned Cases</th>
          <th>Executed Cases</th>
          <th>Passed Cases</th>
          <th>Failed Cases</th>
          <th>Not Executed (Pending)</th>
          <th>Pass % (of Executed)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>Mod A: Registration</strong></td><td>7</td><td>7</td><td>7</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod B: Authentication</strong></td><td>7</td><td>7</td><td>7</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod C: Profile Mgmt</strong></td><td>5</td><td>4</td><td>4</td><td>0</td><td>1</td><td>100.0%</td></tr>
        <tr><td><strong>Mod D: Directory & Search</strong></td><td>6</td><td>6</td><td>6</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod E: Connections & Mentor</strong></td><td>5</td><td>5</td><td>5</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod F: Jobs & Opportunities</strong></td><td>5</td><td>5</td><td>5</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod G: Messages & Alerts</strong></td><td>4</td><td>4</td><td>4</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod H: Admin & Verification</strong></td><td>4</td><td>4</td><td>4</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod I: Database Integration</strong></td><td>5</td><td>5</td><td>5</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod J: UI, Fonts & Theme</strong></td><td>6</td><td>6</td><td>6</td><td>0</td><td>0</td><td>100.0%</td></tr>
        <tr><td><strong>Mod K: Security Testing</strong></td><td>6</td><td>5</td><td>5</td><td>0</td><td>1</td><td>100.0%</td></tr>
        <tr class="summary-total-row">
          <td><strong>TOTALS:</strong></td>
          <td><strong>60</strong></td>
          <td><strong>58</strong></td>
          <td><strong>58</strong></td>
          <td><strong>0</strong></td>
          <td><strong>2</strong></td>
          <td><strong>100.0%</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
  `;
};
