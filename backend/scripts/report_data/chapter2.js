module.exports = function getChapter2(meta) {
  return `
  <!-- CHAPTER 2 -->
  <div class="page chapter-page">
    <div class="chapter-badge">Chapter 2</div>
    <h1 class="chapter-title">SOFTWARE REQUIREMENTS AND SYSTEM ANALYSIS</h1>
    <hr class="heading-rule" />

    <h2>2.1 Hardware and Software Requirements</h2>
    <p>
      The execution and quality validation of Alumni Connect requires clearly delineated hardware and software specifications across client and server tiers:
    </p>

    <h3>2.1.1 Hardware Specifications</h3>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Tier</th>
          <th>Component</th>
          <th>Minimum Specification</th>
          <th>Recommended Specification</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowspan="3"><strong>Server / Dev Host</strong></td>
          <td>Processor (CPU)</td>
          <td>Dual-Core x86_64, 2.0 GHz</td>
          <td>Quad-Core Intel Core i5 / AMD Ryzen 5 or higher</td>
        </tr>
        <tr>
          <td>System Memory (RAM)</td>
          <td>4 GB DDR4</td>
          <td>8 GB to 16 GB DDR4/DDR5</td>
        </tr>
        <tr>
          <td>Storage Space</td>
          <td>10 GB free space (SSD preferred)</td>
          <td>25 GB NVMe SSD storage</td>
        </tr>
        <tr>
          <td rowspan="3"><strong>Client Machine</strong></td>
          <td>Processor (CPU)</td>
          <td>Single-Core 1.5 GHz</td>
          <td>Multi-Core modern mobile or desktop processor</td>
        </tr>
        <tr>
          <td>System Memory (RAM)</td>
          <td>2 GB</td>
          <td>4 GB or higher</td>
        </tr>
        <tr>
          <td>Display Resolution</td>
          <td>320 &times; 568 (Mobile Viewport)</td>
          <td>1920 &times; 1080 (Full HD Desktop)</td>
        </tr>
      </tbody>
    </table>

    <h3>2.1.2 Software Specifications</h3>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Software / Library</th>
          <th>Version</th>
          <th>Purpose in System</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>Runtime Environment</strong></td><td>Node.js</td><td>v20.x or v24.x LTS</td><td>JavaScript runtime for server execution and build tooling</td></tr>
        <tr><td><strong>Package Manager</strong></td><td>npm</td><td>v10.x</td><td>Dependency management for frontend and backend modules</td></tr>
        <tr><td><strong>Server Framework</strong></td><td>Express.js</td><td>v4.21.0</td><td>REST API routing, middleware execution, and request parsing</td></tr>
        <tr><td><strong>Database Engine</strong></td><td>MongoDB Community Server</td><td>v7.0+ / Memory Server</td><td>NoSQL document database for JSON-like schema persistence</td></tr>
        <tr><td><strong>Object Data Modeling</strong></td><td>Mongoose</td><td>v8.7.0</td><td>Schema definition, validation rules, and indexing</td></tr>
        <tr><td><strong>Client Framework</strong></td><td>React</td><td>v18.3.1</td><td>Component-based reactive Single Page Application (SPA)</td></tr>
        <tr><td><strong>Frontend Bundler</strong></td><td>Vite</td><td>v5.4.x</td><td>Fast HMR development server and production Rollup bundler</td></tr>
        <tr><td><strong>CSS Framework</strong></td><td>Tailwind CSS</td><td>v3.4.x</td><td>Utility-first responsive design system and token styling</td></tr>
        <tr><td><strong>Authentication</strong></td><td>jsonwebtoken / bcrypt</td><td>v9.0.2 / v6.0.0</td><td>Cryptographic token generation and password salt hashing</td></tr>
        <tr><td><strong>Testing Utilities</strong></td><td>Custom Suites / Supertest</td><td>Node.js Test Framework</td><td>Automated unit, security, typography, and theme verification</td></tr>
      </tbody>
    </table>

    <h2>2.2 System Architecture (Three-Tier MVC Architecture)</h2>
    <p>
      Alumni Connect is structured upon an industry-standard <strong>Three-Tier Model-View-Controller (MVC)</strong> web architecture. This guarantees loose coupling, high cohesion, maintainability, and isolated testability across presentation, logic, and persistence layers.
    </p>

    <div class="diagram-box">
      <div class="diagram-title">Figure 2.1: Three-Tier System Architecture of Alumni Connect</div>
      <div class="architecture-grid">
        <div class="arch-tier client-tier">
          <h4>Tier 1: Presentation Layer (Client)</h4>
          <p><strong>React 18 SPA (Vite)</strong></p>
          <ul>
            <li>Client-Side React Router v6</li>
            <li>Theme & Font Engine (CSS Variables)</li>
            <li>Tailwind CSS Design Tokens</li>
            <li>Context Providers (Auth, Toast, Socket)</li>
          </ul>
        </div>
        <div class="arch-arrow">&harr; HTTP/HTTPS REST & WebSockets &harr;</div>
        <div class="arch-tier server-tier">
          <h4>Tier 2: Application / API Layer (Server)</h4>
          <p><strong>Express.js / Node.js Engine</strong></p>
          <ul>
            <li>Authentication & JWT Guard Middleware</li>
            <li>REST Controllers (Alumni, Jobs, QA, Admin)</li>
            <li>Input Sanitization & Helmet Security</li>
            <li>Socket.IO Event Dispatcher</li>
          </ul>
        </div>
        <div class="arch-arrow">&harr; Mongoose ODM (BSON Protocols) &harr;</div>
        <div class="arch-tier data-tier">
          <h4>Tier 3: Persistence Layer (Database)</h4>
          <p><strong>MongoDB Enterprise / Community</strong></p>
          <ul>
            <li>Collections: Users, Profiles, Jobs, Messages</li>
            <li>Unique Compound Indexes</li>
            <li>Data Integrity Validation Rules</li>
            <li>Audit Logging Storage</li>
          </ul>
        </div>
      </div>
    </div>

    <h2>2.3 Responsibilities of System Components</h2>
    <ul>
      <li><strong>Presentation Layer (React Frontend):</strong> Renders responsive views, manages client state, captures user inputs, provides immediate form feedback, manages theme switching (Light/Dark) via DOM root mutation, stores JWT tokens in secure browser storage, and intercepts HTTP responses to handle expired authorizations.</li>
      <li><strong>Application Layer (Express REST API):</strong> Validates incoming JSON payloads, enforces institutional email regex gating (<code>/@kkwagh\\.edu\\.in$/i</code>), checks bcrypt password hashes, issues and signs tamper-resistant JWT tokens, checks role permissions (e.g., student vs. admin access), executes business logic, and maps controller outputs to standardized HTTP status codes (200, 201, 400, 401, 403, 404, 500).</li>
      <li><strong>Data Layer (MongoDB & Mongoose):</strong> Stores unstructured and structured business records in BSON format, enforces schema data types (Strings, Dates, ObjectIds), enforces unique constraints on email addresses to prevent duplicate accounts, and executes indexing for high-speed directory queries.</li>
    </ul>

    <h2>2.4 User Roles and Permissions Matrix</h2>
    <p>
      The platform enforces strict Role-Based Access Control (RBAC). Table 2.3 defines the authoritative permissions matrix:
    </p>
    <table class="academic-table">
      <thead>
        <tr>
          <th>System Capability / Route</th>
          <th>Student</th>
          <th>Unverified Alumni</th>
          <th>Verified Alumni</th>
          <th>Teacher / Guide</th>
          <th>Administrator</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Browse Landing & Login</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&check; Allowed</td></tr>
        <tr><td>Register with Institutional Email</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&cross; Admin created</td></tr>
        <tr><td>Access Student Dashboard</td><td>&check; Allowed</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td></tr>
        <tr><td>Access Pending Verification Screen</td><td>&cross; N/A</td><td>&check; Dedicated</td><td>&cross; Bypassed</td><td>&cross; N/A</td><td>&cross; N/A</td></tr>
        <tr><td>View Public Alumni Directory</td><td>&check; Allowed</td><td>&cross; Restricted</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&check; Allowed</td></tr>
        <tr><td>Display Verified Badge in Directory</td><td>&cross; No badge</td><td>&cross; Hidden</td><td>&check; Displayed</td><td>&check; Faculty badge</td><td>&check; Admin badge</td></tr>
        <tr><td>Send Connection Requests</td><td>&check; To Alumni</td><td>&cross; Restricted</td><td>&check; To All</td><td>&check; To All</td><td>&check; To All</td></tr>
        <tr><td>Submit Mentorship Guidance Request</td><td>&check; Allowed</td><td>&cross; Restricted</td><td>&cross; Receives</td><td>&check; Manages</td><td>&check; Audits</td></tr>
        <tr><td>Post Job / Internship Opportunities</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&check; Allowed</td></tr>
        <tr><td>Post Question in Q&A Forum</td><td>&check; Allowed</td><td>&cross; Restricted</td><td>&check; Allowed</td><td>&check; Allowed</td><td>&check; Allowed</td></tr>
        <tr><td>Post Answer in Q&A Forum</td><td>&check; Allowed</td><td>&cross; Restricted</td><td>&check; Allowed</td><td>&check; Endorsed</td><td>&check; Moderates</td></tr>
        <tr><td>Access Teacher Dashboard & Capstone</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&check; Full Access</td><td>&check; Full Access</td></tr>
        <tr><td>Access Admin Verification Console</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&check; Full Access</td></tr>
        <tr><td>Approve / Reject Alumni Verification</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&check; Full Access</td></tr>
        <tr><td>Trigger Admin Password Recovery</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&cross; Restricted</td><td>&check; Full Access</td></tr>
      </tbody>
    </table>

    <h2>2.5 Data Flow and Application Workflow</h2>
    <h3>2.5.1 Data Flow Diagram (DFD Level 0 — Context Level)</h3>
    <div class="diagram-box">
      <div class="diagram-title">Figure 2.2: DFD Level 0 (Context Diagram) of Alumni Connect</div>
      <p style="text-align: center; margin: 10px 0;">
        <strong>[ External Entities: Student | Alumni | Teacher | Admin ]</strong><br/>
        &darr; <em>Credentials, Search Queries, Profile Updates, Requests</em> &darr;<br/>
        <strong>[ PROCESS 0.0: ALUMNI CONNECT PLATFORM ]</strong><br/>
        &uarr; <em>Profiles, Mentorship Feeds, JWT Tokens, Verification Audits</em> &uarr;<br/>
        <strong>[ DATA STORE: MongoDB Database Collections ]</strong>
      </p>
    </div>

    <h3>2.5.2 Data Flow Diagram (DFD Level 1 — Functional Decomposition)</h3>
    <p>
      At Level 1, the system divides into four primary functional sub-processes:
    </p>
    <ol>
      <li><strong>Process 1.0 (Identity & Authentication):</strong> Accepts registration/login requests, hashes passwords via bcrypt, queries <code>Users</code> collection, generates JWT Bearer tokens.</li>
      <li><strong>Process 2.0 (Alumni Profile & Directory Management):</strong> Handles profile creation, company timelines, and skill tags; stores records in <code>AlumniProfiles</code>; services search requests.</li>
      <li><strong>Process 3.0 (Networking, Mentorship & Guidance):</strong> Processes connection requests between students and alumni, stores states (<code>pending</code>, <code>accepted</code>, <code>rejected</code>) in <code>Connections</code>, and triggers real-time socket events.</li>
      <li><strong>Process 4.0 (Administrative Audit & Verification):</strong> Collects unverified alumni profiles, presents them to the Administrator, updates verification flags, and records entries in <code>AdminAuditLogs</code>.</li>
    </ol>

    <h2>2.6 Relevant Database Entities and Relationships (ER Model)</h2>
    <p>
      The persistence tier comprises nine interrelated Mongoose schemas:
    </p>
    <table class="academic-table">
      <thead>
        <tr>
          <th>Entity Name</th>
          <th>Key Attributes</th>
          <th>Cardinality / Foreign References</th>
          <th>Integrity Constraints</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>User</strong></td>
          <td>_id, name, email, password, role, isVerified, createdAt</td>
          <td>1 : 1 with AlumniProfile / TeacherProfile</td>
          <td>Unique index on email; role enum: [student, alumni, teacher, admin]</td>
        </tr>
        <tr>
          <td><strong>AlumniProfile</strong></td>
          <td>_id, user, currentCompany, currentJobTitle, graduationYear, skills, verifiedByAdmin</td>
          <td>N : 1 reference to User._id</td>
          <td>graduationYear numeric constraint; skills array of strings</td>
        </tr>
        <tr>
          <td><strong>TeacherProfile</strong></td>
          <td>_id, user, department, designation, cabinLocation, guidanceSlots</td>
          <td>1 : 1 reference to User._id</td>
          <td>Department required; designation enum</td>
        </tr>
        <tr>
          <td><strong>Connection</strong></td>
          <td>_id, requester, recipient, status, message, createdAt</td>
          <td>N : 1 to User (requester), N : 1 to User (recipient)</td>
          <td>Compound unique index on { requester, recipient }; status enum</td>
        </tr>
        <tr>
          <td><strong>MentorshipRequest</strong></td>
          <td>_id, student, mentor, topic, description, status</td>
          <td>N : 1 to User (student), N : 1 to User (mentor)</td>
          <td>Topic non-empty string; status enum: [pending, accepted, rejected]</td>
        </tr>
        <tr>
          <td><strong>Job</strong></td>
          <td>_id, postedBy, title, company, location, type, workMode, requiredSkills</td>
          <td>N : 1 reference to User (postedBy)</td>
          <td>Type enum: [full-time, internship]; workMode: [remote, hybrid, on-site]</td>
        </tr>
        <tr>
          <td><strong>Message</strong></td>
          <td>_id, conversationId, sender, recipient, content, read, createdAt</td>
          <td>N : 1 references to User entities</td>
          <td>Content non-empty trimmed string; indexed conversationId</td>
        </tr>
        <tr>
          <td><strong>Notification</strong></td>
          <td>_id, recipient, title, message, type, read, link</td>
          <td>N : 1 reference to User (recipient)</td>
          <td>Type enum: [connection, mentorship, job, system]</td>
        </tr>
        <tr>
          <td><strong>PasswordResetRequest</strong></td>
          <td>_id, user, email, status, requestedAt, resolvedBy</td>
          <td>N : 1 to User, N : 1 to User (admin)</td>
          <td>Status enum: [pending, completed, rejected]</td>
        </tr>
      </tbody>
    </table>

    <h2>2.7 Authentication and Authorization Workflow</h2>
    <p>
      The authentication workflow enforces cryptographic guarantees at each stage:
    </p>
    <ol>
      <li><strong>Password Hashing on Registration:</strong> Plaintext passwords submitted during registration are processed with bcrypt using a salt factor of 10. The resulting 60-character hash (e.g., <code>$2b$10$...</code>) is persisted; plaintext passwords never touch database disks.</li>
      <li><strong>JWT Generation on Login:</strong> Upon credential verification via <code>bcrypt.compare()</code>, the server signs a JSON Web Token with HMAC SHA-256 utilizing a secure server secret (<code>JWT_SECRET</code>). The token payload contains <code>{ id, role, isVerified }</code> and an expiration lifespan.</li>
      <li><strong>Middleware Verification:</strong> Protected routes pass through <code>protect</code> middleware, which extracts the token from <code>Authorization: Bearer &lt;token&gt;</code>, invokes <code>jwt.verify()</code>, and attaches the authenticated user record to <code>req.user</code>.</li>
      <li><strong>Role Guards:</strong> Route-specific middleware (e.g., <code>authorize('admin')</code>) checks <code>req.user.role</code>. If the role does not match, a <code>403 Forbidden</code> response is immediately terminated prior to controller entry.</li>
    </ol>

    <h2>2.8 Assumptions, Dependencies, and Constraints</h2>
    <ul>
      <li><strong>Institutional Email Prerequisite:</strong> It is assumed that every valid institutional member possesses an active institutional email ending in <code>@kkwagh.edu.in</code>.</li>
      <li><strong>Single Institution Boundary:</strong> The application database is scoped to KKWIEER Nashik; multi-tenant university partitioning is not implemented in the current baseline.</li>
      <li><strong>JavaScript Enabled:</strong> The React 18 client requires client-side JavaScript execution; modern ECMAScript 2020+ capabilities are mandated.</li>
    </ul>
  </div>
  `;
};
