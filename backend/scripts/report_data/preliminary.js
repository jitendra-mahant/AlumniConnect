module.exports = function getPreliminary(meta) {
  const { studentName, rollNumber, className, subjectName, projectTitle, academicYear, collegeName, departmentName, universityName, guideName, hodName, principalName, logoBase64 } = meta;

  const html = `
  <!-- COVER PAGE -->
  <div class="page cover-page">
    <div class="cover-header">
      <h3 class="society-title">K. K. Wagh Education Society's</h3>
      <h1 class="college-title">K. K. Wagh Institute of Engineering Education & Research, Nashik</h1>
      <h4 class="autonomous-tag">(Autonomous Institute Affiliated to Savitribai Phule Pune University)</h4>
      <h3 class="dept-title">${departmentName}</h3>
    </div>

    <div class="cover-logo-container">
      ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="KKWIEER Logo" class="college-logo" />` : '<div class="logo-placeholder">[College Logo]</div>'}
    </div>

    <div class="cover-project-info">
      <p class="report-subtitle">A PROJECT REPORT ON</p>
      <h2 class="project-main-title">${projectTitle}</h2>
      <p class="subject-subtitle">Submitted in partial fulfillment of the academic requirements for the subject</p>
      <h3 class="subject-title">${subjectName}</h3>
      <p class="degree-title">in Bachelor of Technology (B.Tech) in Computer Engineering</p>
    </div>

    <div class="cover-sign-row">
      <div class="sign-block submitted-by">
        <p class="sign-role">Submitted by:</p>
        <p class="sign-name"><strong>${studentName}</strong></p>
        <p class="sign-detail">Roll No: <strong>${rollNumber}</strong></p>
        <p class="sign-detail">Class: <strong>${className}</strong></p>
        <p class="sign-detail">Academic Year: <strong>${academicYear}</strong></p>
      </div>
      <div class="sign-block guided-by">
        <p class="sign-role">Under the Guidance of:</p>
        <p class="sign-name"><strong>${guideName}</strong></p>
        <p class="sign-detail">Assistant Professor</p>
        <p class="sign-detail">${departmentName}</p>
        <p class="sign-detail">${collegeName}</p>
      </div>
    </div>

    <div class="cover-footer">
      <p><strong>Department of Computer Engineering</strong></p>
      <p>K. K. Wagh Institute of Engineering Education & Research, Nashik — 422003</p>
      <p>Academic Year: ${academicYear}</p>
    </div>
  </div>

  <!-- CERTIFICATE -->
  <div class="page cert-page">
    <div class="cert-header">
      <h3>K. K. Wagh Education Society's</h3>
      <h2>K. K. Wagh Institute of Engineering Education & Research, Nashik</h2>
      <h4>(Autonomous Institute Affiliated to Savitribai Phule Pune University)</h4>
      <h3>Department of Computer Engineering</h3>
    </div>

    <div class="cert-title-container">
      <h1 class="cert-title">CERTIFICATE</h1>
    </div>

    <p class="cert-body">
      This is to certify that the project report entitled <strong>"${projectTitle}"</strong> submitted by 
      <strong>${studentName}</strong> (Roll No: <strong>${rollNumber}</strong>, Class: <strong>${className}</strong>) 
      is a bonafide record of work carried out by him in partial fulfillment of the requirements for the course 
      <strong>${subjectName}</strong> of Third Year B.Tech Computer Engineering at 
      <strong>${collegeName}</strong> during the academic year <strong>${academicYear}</strong>.
    </p>

    <p class="cert-body">
      The project work has been examined, rigorously tested, and evaluated according to standard software testing methodologies, test design principles, and quality assurance criteria.
    </p>

    <div class="cert-signatures">
      <div class="cert-sig-box">
        <div class="sig-line"></div>
        <p><strong>${guideName}</strong></p>
        <p>Project Guide / Faculty In-Charge</p>
        <p>Department of Computer Engineering</p>
      </div>
      <div class="cert-sig-box">
        <div class="sig-line"></div>
        <p><strong>${hodName}</strong></p>
        <p>Head of Department</p>
        <p>Department of Computer Engineering</p>
      </div>
    </div>

    <div class="cert-signatures secondary-sigs">
      <div class="cert-sig-box">
        <div class="sig-line"></div>
        <p><strong>${principalName}</strong></p>
        <p>Principal</p>
        <p>KKWIEER, Nashik</p>
      </div>
      <div class="cert-sig-box">
        <div class="sig-line"></div>
        <p><strong>External Examiner</strong></p>
        <p>Seal / Date</p>
        <p>Savitribai Phule Pune University</p>
      </div>
    </div>
  </div>

  <!-- DECLARATION -->
  <div class="page decl-page">
    <h2 class="academic-heading">CANDIDATE DECLARATION</h2>
    <hr class="heading-rule" />
    <p class="decl-body">
      I, <strong>${studentName}</strong>, student of Third Year B.Tech in Computer Engineering at 
      <strong>K. K. Wagh Institute of Engineering Education & Research, Nashik</strong>, hereby declare that the project report entitled 
      <strong>"${projectTitle}"</strong> submitted to the Department of Computer Engineering for the subject 
      <strong>${subjectName}</strong> is an authentic record of original project development, testing, and quality assurance work completed under the guidance of 
      <strong>${guideName}</strong>.
    </p>
    <p class="decl-body">
      I further confirm that the test cases, defect evaluations, and automated verification suites presented herein reflect genuine analysis of the MERN stack codebase. Wherever external libraries, test frameworks, academic publications, or university guidelines were utilized, proper citations and references have been provided.
    </p>
    <div class="decl-sign-box">
      <br/><br/>
      <p>Date: October 26, 2026</p>
      <p>Place: Nashik, Maharashtra</p>
      <div class="sig-line-short"></div>
      <p><strong>${studentName}</strong></p>
      <p>Roll No: ${rollNumber} | Class: ${className}</p>
      <p>Department of Computer Engineering</p>
    </div>
  </div>

  <!-- ACKNOWLEDGEMENT -->
  <div class="page ack-page">
    <h2 class="academic-heading">ACKNOWLEDGEMENT</h2>
    <hr class="heading-rule" />
    <p class="ack-body">
      I express my sincere and heartfelt gratitude to my project guide, <strong>${guideName}</strong>, Assistant Professor, Department of Computer Engineering, for his invaluable guidance, continuous encouragement, constructive critiques, and meticulous supervision throughout the development and testing phases of this project. His deep insights into Software Testing Life Cycles (STLC) and software quality evaluation provided strong direction for this work.
    </p>
    <p class="ack-body">
      I am profoundly thankful to <strong>${hodName}</strong>, Head of the Department of Computer Engineering, for providing access to computing facilities, academic software resources, and an encouraging departmental atmosphere that enabled the thorough execution of our verification activities.
    </p>
    <p class="ack-body">
      I extend my gratitude to our respected Principal, <strong>${principalName}</strong>, for his administrative leadership and support for industry-grade project development within the autonomous curriculum.
    </p>
    <p class="ack-body">
      Finally, I thank my family, faculty members, lab assistants, and fellow classmates for their unwavering support, collaborative reviews, and feedback during our usability and peer-testing sessions.
    </p>
    <div class="ack-sign-box">
      <br/>
      <p><strong>${studentName}</strong></p>
      <p>Roll No: ${rollNumber} | TY B.Tech Computer Engineering</p>
    </div>
  </div>

  <!-- ABSTRACT -->
  <div class="page abs-page">
    <h2 class="academic-heading">ABSTRACT</h2>
    <hr class="heading-rule" />
    <p class="abs-body">
      In contemporary higher education ecosystems, maintaining an engaged, authenticated, and productive network between current undergraduates and institutional alumni is a primary driver of career readiness, mentorship, and placement opportunities. <strong>Alumni Connect</strong> is a dedicated full-stack web platform built for K. K. Wagh Institute of Engineering Education & Research (KKWIEER), Nashik, engineered on the MERN stack (MongoDB, Express.js, React 18, Node.js) with Tailwind CSS, JSON Web Token (JWT) role-based authorization, and real-time Socket.IO synchronization.
    </p>
    <p class="abs-body">
      This academic project report presents a thorough, systematic application of <strong>Software Testing and Quality Assurance (STQA)</strong> principles across the Alumni Connect system lifecycle. Adhering to the Software Testing Life Cycle (STLC) and the IEEE 829 test documentation standard, the platform was subjected to multi-tiered verification and validation encompassing:
    </p>
    <ul class="abs-list">
      <li><strong>Black-Box Test Case Design:</strong> Employing Equivalence Class Partitioning (EP), Boundary Value Analysis (BVA), and Decision Table techniques across registration, authentication, directory search, mentorship requests, and administrator verification workflows.</li>
      <li><strong>White-Box & API Verification:</strong> Evaluating Express middleware execution paths, password hashing salt rounds via bcrypt, and JWT route authorization guards.</li>
      <li><strong>Static Quality Auditing:</strong> Executing token compliance scripts against 36 frontend modules to verify WCAG 2.1 AA color contrast compliance, typography standardization (Arial, Helvetica, Times New Roman), and theme state persistence.</li>
      <li><strong>Defect Management:</strong> Documenting the end-to-end defect lifecycle from discovery and logging to root-cause analysis (5 Whys and Fishbone) and regression verification.</li>
      <li><strong>Quality Metrics & Evaluation:</strong> Formulating and computing quantitative STQA metrics including Defect Density (DD), Test Execution Rate (TER), Test Pass Percentage (TPP), and Requirements Traceability Matrix (RTM) coverage.</li>
    </ul>
    <p class="abs-body">
      The results demonstrate how disciplined quality assurance transforms academic software into secure, robust, and maintainable enterprise-grade applications.
    </p>
    <p class="keywords">
      <strong>Keywords:</strong> Software Testing and Quality Assurance (STQA), STLC, MERN Stack, Equivalence Partitioning, Boundary Value Analysis, Defect Management, WCAG 2.1 AA, JWT Security, Quality Metrics.
    </p>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="page toc-page">
    <h2 class="academic-heading">TABLE OF CONTENTS</h2>
    <hr class="heading-rule" />
    <table class="toc-table">
      <thead>
        <tr>
          <th>Chapter / Section</th>
          <th>Title</th>
          <th>Page</th>
        </tr>
      </thead>
      <tbody>
        <tr class="toc-special"><td colspan="2">Preliminary Pages (Certificate, Declaration, Acknowledgement, Abstract)</td><td>i–v</td></tr>
        <tr class="toc-special"><td colspan="2">List of Figures & List of Tables</td><td>vi–vii</td></tr>
        <tr class="toc-chap"><td>1</td><td><strong>INTRODUCTION</strong></td><td>1</td></tr>
        <tr><td>1.1</td><td>Overview of Software Testing and Quality Assurance</td><td>1</td></tr>
        <tr><td>1.2</td><td>Need for Software Testing in Web Applications</td><td>2</td></tr>
        <tr><td>1.3</td><td>Introduction to Alumni Connect Platform</td><td>3</td></tr>
        <tr><td>1.4</td><td>Problem Statement</td><td>4</td></tr>
        <tr><td>1.5</td><td>Project Objectives</td><td>5</td></tr>
        <tr><td>1.6</td><td>Scope of the Project (In-Scope vs. Out-of-Scope)</td><td>5</td></tr>
        <tr><td>1.7</td><td>Existing System and Its Limitations</td><td>6</td></tr>
        <tr><td>1.8</td><td>Proposed System and Architectural Advantages</td><td>7</td></tr>
        <tr><td>1.9</td><td>Functional and Non-Functional Requirements</td><td>8</td></tr>
        <tr class="toc-chap"><td>2</td><td><strong>SOFTWARE REQUIREMENTS AND SYSTEM ANALYSIS</strong></td><td>11</td></tr>
        <tr><td>2.1</td><td>Hardware and Software Requirements</td><td>11</td></tr>
        <tr><td>2.2</td><td>System Architecture (Three-Tier MVC Architecture)</td><td>12</td></tr>
        <tr><td>2.3</td><td>Responsibilities of System Components</td><td>13</td></tr>
        <tr><td>2.4</td><td>User Roles and Permissions Matrix</td><td>14</td></tr>
        <tr><td>2.5</td><td>Data Flow and Application Workflow (DFD Level 0 & 1)</td><td>15</td></tr>
        <tr><td>2.6</td><td>Relevant Database Entities and Relationships (ER Model)</td><td>17</td></tr>
        <tr><td>2.7</td><td>Authentication and Authorization Workflow</td><td>19</td></tr>
        <tr><td>2.8</td><td>Assumptions, Dependencies, and Constraints</td><td>20</td></tr>
        <tr class="toc-chap"><td>3</td><td><strong>SOFTWARE TESTING METHODOLOGY</strong></td><td>22</td></tr>
        <tr><td>3.1</td><td>Software Testing Life Cycle (STLC) in Alumni Connect</td><td>22</td></tr>
        <tr><td>3.2</td><td>Verification versus Validation (The V-Model)</td><td>24</td></tr>
        <tr><td>3.3</td><td>Static versus Dynamic Testing</td><td>25</td></tr>
        <tr><td>3.4</td><td>Black-Box versus White-Box Testing Strategies</td><td>26</td></tr>
        <tr><td>3.5</td><td>Manual versus Automated Testing</td><td>28</td></tr>
        <tr><td>3.6</td><td>Taxonomy of Testing Levels and Types</td><td>29</td></tr>
        <tr class="toc-chap"><td>4</td><td><strong>TEST PLAN (IEEE 829 STANDARD)</strong></td><td>33</td></tr>
        <tr><td>4.1</td><td>Test Plan Identifier and Metadata</td><td>33</td></tr>
        <tr><td>4.2</td><td>Testing Objectives and Success Criteria</td><td>33</td></tr>
        <tr><td>4.3</td><td>Features to be Tested (In-Scope)</td><td>34</td></tr>
        <tr><td>4.4</td><td>Features Not to be Tested (Out-of-Scope)</td><td>34</td></tr>
        <tr><td>4.5</td><td>Testing Approach and Strategy</td><td>35</td></tr>
        <tr><td>4.6</td><td>Test Environment Setup</td><td>36</td></tr>
        <tr><td>4.7</td><td>Test Data Requirements and Synthetic Payloads</td><td>37</td></tr>
        <tr><td>4.8</td><td>Entry and Exit Criteria</td><td>38</td></tr>
        <tr><td>4.9</td><td>Roles and Responsibilities (RACI Matrix)</td><td>39</td></tr>
        <tr><td>4.10</td><td>Test Deliverables</td><td>39</td></tr>
        <tr><td>4.11</td><td>Risks and Mitigation Strategies</td><td>40</td></tr>
        <tr><td>4.12</td><td>Testing Schedule and Milestones</td><td>41</td></tr>
        <tr class="toc-chap"><td>5</td><td><strong>DETAILED TEST CASES SPECIFICATION</strong></td><td>43</td></tr>
        <tr><td>5.1</td><td>Module A: User Registration</td><td>43</td></tr>
        <tr><td>5.2</td><td>Module B: Login and Authentication</td><td>47</td></tr>
        <tr><td>5.3</td><td>Module C: Profile Management</td><td>51</td></tr>
        <tr><td>5.4</td><td>Module D: Alumni Directory and Search</td><td>54</td></tr>
        <tr><td>5.5</td><td>Module E: Connections and Mentorship</td><td>58</td></tr>
        <tr><td>5.6</td><td>Module F: Jobs and Opportunities</td><td>61</td></tr>
        <tr><td>5.7</td><td>Module G: Messaging and Notifications</td><td>64</td></tr>
        <tr><td>5.8</td><td>Module H: Administration and Verification</td><td>67</td></tr>
        <tr><td>5.9</td><td>Module I: Database Integration and Data Persistence</td><td>70</td></tr>
        <tr><td>5.10</td><td>Module J: User Interface, Typography, and Compatibility</td><td>73</td></tr>
        <tr><td>5.11</td><td>Module K: Security and Vulnerability Testing</td><td>77</td></tr>
        <tr class="toc-chap"><td>6</td><td><strong>TEST EXECUTION AND RESULTS</strong></td><td>81</td></tr>
        <tr><td>6.1</td><td>Test Execution Procedure and Protocol</td><td>81</td></tr>
        <tr><td>6.2</td><td>Test Result Recording and Evidence Capture</td><td>82</td></tr>
        <tr><td>6.3</td><td>Expected versus Actual Results Analysis</td><td>83</td></tr>
        <tr><td>6.4</td><td>Pass/Fail Criteria and Quality Thresholds</td><td>84</td></tr>
        <tr><td>6.5</td><td>Defect Severity and Priority Categorization</td><td>85</td></tr>
        <tr><td>6.6</td><td>Defect Life Cycle State Machine</td><td>86</td></tr>
        <tr><td>6.7</td><td>Sample Real-World Defect Reports</td><td>87</td></tr>
        <tr><td>6.8</td><td>Retesting and Regression Testing Outcomes</td><td>90</td></tr>
        <tr><td>6.9</td><td>Summary Table of Test Execution Status</td><td>91</td></tr>
        <tr class="toc-chap"><td>7</td><td><strong>AUTOMATION AND TESTING TOOLS</strong></td><td>93</td></tr>
        <tr><td>7.1</td><td>Automated Testing Architecture for the MERN Stack</td><td>93</td></tr>
        <tr><td>7.2</td><td>Tools Selection, Purpose, and Setup</td><td>94</td></tr>
        <tr><td>7.3</td><td>Project Test Scripts Walkthrough and Assertions</td><td>96</td></tr>
        <tr><td>7.4</td><td>Test Execution Instructions and Command Reference</td><td>99</td></tr>
        <tr><td>7.5</td><td>Continuous Integration (CI) Blueprint</td><td>101</td></tr>
        <tr class="toc-chap"><td>8</td><td><strong>QUALITY ASSURANCE AND QUALITY METRICS</strong></td><td>103</td></tr>
        <tr><td>8.1</td><td>Quality Assurance (QA) versus Quality Control (QC)</td><td>103</td></tr>
        <tr><td>8.2</td><td>Mathematical Definitions of Standard STQA Metrics</td><td>104</td></tr>
        <tr><td>8.3</td><td>Metric Calculations for Alumni Connect</td><td>106</td></tr>
        <tr><td>8.4</td><td>Software Quality Dimensions (ISO/IEC 25010 Evaluation)</td><td>108</td></tr>
        <tr><td>8.5</td><td>Preventive versus Corrective Quality Activities</td><td>110</td></tr>
        <tr class="toc-chap"><td>9</td><td><strong>DEFECT MANAGEMENT AND RISK ANALYSIS</strong></td><td>112</td></tr>
        <tr><td>9.1</td><td>Defect Logging and Triage Workflow</td><td>112</td></tr>
        <tr><td>9.2</td><td>Defect Classification and Severity/Priority Matrix</td><td>113</td></tr>
        <tr><td>9.3</td><td>Root Cause Analysis (5 Whys and Fishbone Analysis)</td><td>114</td></tr>
        <tr><td>9.4</td><td>Software Risk Assessment Matrix</td><td>116</td></tr>
        <tr><td>9.5</td><td>Alumni Connect Domain-Specific Vulnerabilities and Mitigation</td><td>117</td></tr>
        <tr><td>9.6</td><td>Corrective Action Protocols</td><td>119</td></tr>
        <tr class="toc-chap"><td>10</td><td><strong>RESULTS, LIMITATIONS, AND FUTURE SCOPE</strong></td><td>121</td></tr>
        <tr><td>10.1</td><td>Summary of Planned and Executed Testing</td><td>121</td></tr>
        <tr><td>10.2</td><td>Confirmed Results and Production Readiness</td><td>122</td></tr>
        <tr><td>10.3</td><td>Known Limitations</td><td>123</td></tr>
        <tr><td>10.4</td><td>Unverified Functionality</td><td>124</td></tr>
        <tr><td>10.5</td><td>Future Scope and Roadmap</td><td>125</td></tr>
        <tr><td>10.6</td><td>Recommendations for Long-Term Software Quality</td><td>126</td></tr>
        <tr class="toc-chap"><td colspan="2"><strong>FINAL SECTIONS</strong></td><td>128</td></tr>
        <tr><td>—</td><td>Conclusion</td><td>128</td></tr>
        <tr><td>—</td><td>References and Bibliography (IEEE Standard)</td><td>129</td></tr>
        <tr class="toc-chap"><td colspan="2"><strong>APPENDICES</strong></td><td>131</td></tr>
        <tr><td>App A</td><td>Requirements Traceability Matrix (RTM)</td><td>131</td></tr>
        <tr><td>App B</td><td>Defect Logging and Management Template</td><td>134</td></tr>
        <tr><td>App C</td><td>Sample REST API Test Scenarios (curl & JSON Payloads)</td><td>136</td></tr>
        <tr><td>App D</td><td>Test Execution Sign-Off Sheet Template</td><td>139</td></tr>
        <tr><td>App E</td><td>Comprehensive Glossary of STQA Terminology</td><td>141</td></tr>
      </tbody>
    </table>
  </div>
  `;

  return html;
};
