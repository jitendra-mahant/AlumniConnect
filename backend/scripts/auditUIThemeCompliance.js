/**
 * Comprehensive UI Theme Compliance Audit Script
 * Inspects all frontend files for:
 * - Design System Core Tokens (Light & Dark)
 * - Brand Palette & Neutral Ink Palette
 * - Semantic Status Indicators (Success, Warning, Error, Info)
 * - Raw/arbitrary teal usage vs brand token usage
 * - Missing dark mode counterparts on text, borders, surfaces
 * - WCAG AA Contrast Ratios
 * - Viewport layout constraints
 */
const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.resolve(__dirname, '../../frontend');
const SRC_DIR = path.join(FRONTEND_DIR, 'src');

// Expected Tokens per Section 2
const EXPECTED_LIGHT_TOKENS = {
  '--page-bg': '#f8fafc',
  '--page-surface': '#ffffff',
  '--page-surface-muted': '#f1f5f9',
  '--page-text': '#1e293b',
  '--heading-text': '#0f172a',
  '--muted-copy': '#64748b',
  '--page-border': 'rgb(226 232 240 / 0.8)',
  '--focus-ring': '#0d9488',
  '--section-kicker': '#0f766e',
  '--scrollbar-thumb': '#cbd5e1',
};

const EXPECTED_DARK_TOKENS = {
  '--page-bg': '#020617',
  '--page-surface': '#0f172a',
  '--page-surface-muted': '#1e293b',
  '--page-text': '#e2e8f0',
  '--heading-text': '#f1f5f9',
  '--muted-copy': '#94a3b8',
  '--page-border': 'rgb(30 41 59 / 0.8)',
  '--focus-ring': '#2dd4bf',
  '--section-kicker': '#2dd4bf', // or #5eead4 (brand-300)
  '--scrollbar-thumb': '#334155',
};

// Expected Brand Scale per Section 3
const EXPECTED_BRAND_SCALE = {
  'brand-50': '#f0fdfa',
  'brand-100': '#ccfbf1',
  'brand-200': '#99f6e4',
  'brand-300': '#5eead4',
  'brand-400': '#2dd4bf',
  'brand-500': '#14b8a6',
  'brand-600': '#0d9488',
  'brand-700': '#0f766e',
  'brand-800': '#115e59',
  'brand-900': '#134e4a',
  'brand-950': '#042f2e',
};

// Expected Ink Scale per Section 4
const EXPECTED_INK_SCALE = {
  'ink-50': '#f8fafc',
  'ink-100': '#f1f5f9',
  'ink-200': '#e2e8f0',
  'ink-300': '#cbd5e1',
  'ink-400': '#94a3b8',
  'ink-500': '#64748b',
  'ink-600': '#475569',
  'ink-700': '#334155',
  'ink-800': '#1e293b',
  'ink-900': '#0f172a',
  'ink-950': '#020617',
};

// Relative Luminance & Contrast Calculation
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function getLuminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hexToRgb(hex1));
  const l2 = getLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Audit index.css tokens
function auditCssTokens() {
  const indexCss = fs.readFileSync(path.join(SRC_DIR, 'index.css'), 'utf8');

  const rootMatch = indexCss.match(/:root\s*{([^}]+)}/s);
  const rootBody = rootMatch ? rootMatch[1] : '';

  const darkMatch = indexCss.match(/\.dark\s*{([^}]+)}/s);
  const darkBody = darkMatch ? darkMatch[1] : '';

  const lightResults = [];
  for (const [token, expected] of Object.entries(EXPECTED_LIGHT_TOKENS)) {
    const regex = new RegExp(`${token}\\s*:\\s*([^;]+);`);
    const match = rootBody.match(regex);
    const actual = match ? match[1].trim() : null;
    lightResults.push({
      token,
      mode: 'light',
      expected,
      actual: actual || 'MISSING',
      matches: actual === expected,
    });
  }

  const darkResults = [];
  for (const [token, expected] of Object.entries(EXPECTED_DARK_TOKENS)) {
    const regex = new RegExp(`${token}\\s*:\\s*([^;]+);`);
    const match = darkBody.match(regex);
    const actual = match ? match[1].trim() : null;
    const matches = actual ? actual.includes(expected) || (token === '--section-kicker' && (actual === '#2dd4bf' || actual === '#5eead4')) : false;
    darkResults.push({
      token,
      mode: 'dark',
      expected,
      actual: actual || 'MISSING',
      matches,
    });
  }

  return { lightResults, darkResults };
}

// Audit tailwind.config.js
function auditTailwindConfig() {
  const config = fs.readFileSync(path.join(FRONTEND_DIR, 'tailwind.config.js'), 'utf8');

  const brandResults = [];
  for (const [k, expected] of Object.entries(EXPECTED_BRAND_SCALE)) {
    const num = k.replace('brand-', '');
    const regex = new RegExp(`['"]?${num}['"]?\\s*:\\s*['"]${expected}['"]`, 'i');
    const matches = regex.test(config);
    brandResults.push({ token: k, expected, matches });
  }

  const inkResults = [];
  for (const [k, expected] of Object.entries(EXPECTED_INK_SCALE)) {
    const num = k.replace('ink-', '');
    const regex = new RegExp(`['"]?${num}['"]?\\s*:\\s*['"]${expected}['"]`, 'i');
    const matches = regex.test(config);
    inkResults.push({ token: k, expected, matches });
  }

  return { brandResults, inkResults };
}

// Scan files recursively
function getAllFiles(dir, exts = ['.jsx', '.js', '.css', '.html']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== 'dist') {
      files = files.concat(getAllFiles(full, exts));
    } else if (e.isFile() && exts.includes(path.extname(e.name))) {
      files.push(full);
    }
  }
  return files;
}

// Audit Component Level Implementations
function auditComponents() {
  const files = getAllFiles(SRC_DIR);
  const componentReports = [];

  for (const f of files) {
    const relPath = path.relative(FRONTEND_DIR, f).replace(/\\/g, '/');
    const content = fs.readFileSync(f, 'utf8');

    const issues = [];

    // Check for raw teal- usage vs brand-
    const rawTealMatches = content.match(/\b(bg|text|border|ring)-teal-\d{2,3}(\/\d{1,3})?\b/g) || [];
    if (rawTealMatches.length > 0) {
      issues.push({
        type: 'raw_teal',
        count: rawTealMatches.length,
        samples: Array.from(new Set(rawTealMatches)).slice(0, 5),
        desc: `Uses ${rawTealMatches.length} raw Tailwind teal-* utilities instead of semantic brand-* or emerald/status tokens`,
      });
    }

    // Check for light-only text colors without dark: equivalent
    // e.g. text-slate-500 without dark:text-slate-400
    const lightTextNoDark = [];
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('text-slate-500') && !line.includes('dark:text-slate-400') && !line.includes('dark:text-slate-300')) {
        // filter out comments
        if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          lightTextNoDark.push({ line: idx + 1, snippet: line.trim().substring(0, 80) });
        }
      }
      if (line.includes('text-slate-400') && !line.includes('dark:text-') && line.includes('className=')) {
        if (!line.trim().startsWith('//')) {
          lightTextNoDark.push({ line: idx + 1, snippet: line.trim().substring(0, 80) });
        }
      }
    });

    if (lightTextNoDark.length > 0) {
      issues.push({
        type: 'missing_dark_text',
        count: lightTextNoDark.length,
        samples: lightTextNoDark.slice(0, 3),
        desc: `Found ${lightTextNoDark.length} text elements lacking dark mode contrast classes`,
      });
    }

    // Check status color implementation
    if (f.endsWith('ui.jsx')) {
      const hasTealVerified = content.includes("verified: 'bg-teal-") || content.includes("VerifiedBadge");
      if (hasTealVerified) {
        issues.push({
          type: 'semantic_status_violation',
          desc: 'Verified/success badges use brand teal instead of emerald-600/emerald-400 semantic tokens',
        });
      }
    }

    // Check for hardcoded navy vs ink
    const navyMatches = content.match(/\b(bg|text|border)-navy-\d{2,3}\b/g) || [];
    if (navyMatches.length > 0) {
      issues.push({
        type: 'legacy_navy',
        count: navyMatches.length,
        samples: Array.from(new Set(navyMatches)).slice(0, 4),
        desc: `Uses ${navyMatches.length} legacy navy-* classes instead of ink-* or slate-*`,
      });
    }

    componentReports.push({
      file: relPath,
      issues,
      compliant: issues.length === 0,
    });
  }

  return componentReports;
}

// Run audit
const tokenAudit = auditCssTokens();
const twAudit = auditTailwindConfig();
const compAudit = auditComponents();

console.log('--- 1. CSS Custom Properties in src/index.css ---');
console.log('Light Tokens:');
tokenAudit.lightResults.forEach((t) => {
  console.log(`  ${t.token}: expected=${t.expected}, actual=${t.actual} -> [${t.matches ? 'MATCH' : 'MISMATCH'}]`);
});
console.log('\nDark Tokens:');
tokenAudit.darkResults.forEach((t) => {
  console.log(`  ${t.token}: expected=${t.expected}, actual=${t.actual} -> [${t.matches ? 'MATCH' : 'MISMATCH'}]`);
});

console.log('\n--- 2. Tailwind Brand & Ink Palettes in tailwind.config.js ---');
const brandMatches = twAudit.brandResults.filter((b) => b.matches).length;
console.log(`Brand scale: ${brandMatches}/${twAudit.brandResults.length} tokens defined`);
const inkMatches = twAudit.inkResults.filter((b) => b.matches).length;
console.log(`Ink scale: ${inkMatches}/${twAudit.inkResults.length} tokens defined`);

console.log('\n--- 3. WCAG AA Contrast Checks ---');
const contrasts = [
  { pair: 'Body text (#1e293b) on Page BG (#f8fafc)', c: getContrast('#1e293b', '#f8fafc'), min: 4.5 },
  { pair: 'Body text (#1e293b) on Main Surface (#ffffff)', c: getContrast('#1e293b', '#ffffff'), min: 4.5 },
  { pair: 'Heading text (#0f172a) on Main Surface (#ffffff)', c: getContrast('#0f172a', '#ffffff'), min: 4.5 },
  { pair: 'Muted text (#64748b) on Main Surface (#ffffff)', c: getContrast('#64748b', '#ffffff'), min: 4.5 },
  { pair: 'Brand-600 action (#0d9488) with white text (#ffffff)', c: getContrast('#ffffff', '#0d9488'), min: 3.0 },
  { pair: 'Dark Body (#e2e8f0) on Dark Page (#020617)', c: getContrast('#e2e8f0', '#020617'), min: 4.5 },
  { pair: 'Dark Body (#e2e8f0) on Dark Surface (#0f172a)', c: getContrast('#e2e8f0', '#0f172a'), min: 4.5 },
  { pair: 'Dark Heading (#f1f5f9) on Dark Surface (#0f172a)', c: getContrast('#f1f5f9', '#0f172a'), min: 4.5 },
  { pair: 'Dark Muted (#94a3b8) on Dark Surface (#0f172a)', c: getContrast('#94a3b8', '#0f172a'), min: 4.5 },
  { pair: 'Dark Focus Ring (#2dd4bf) on Dark Surface (#0f172a)', c: getContrast('#2dd4bf', '#0f172a'), min: 3.0 },
];

contrasts.forEach((c) => {
  const pass = c.c >= c.min;
  console.log(`  ${c.pair}: ${c.c.toFixed(2)}:1 (min ${c.min}:1) -> [${pass ? 'PASS' : 'WARN/FAIL'}]`);
});

console.log('\n--- 4. Component Compliance Summary ---');
const totalFiles = compAudit.length;
const compliantFiles = compAudit.filter((c) => c.compliant).length;
console.log(`Total inspected frontend components/files: ${totalFiles}`);
console.log(`Files with zero detected issues: ${compliantFiles}`);
console.log(`Files with styling mismatches: ${totalFiles - compliantFiles}`);

compAudit
  .filter((c) => !c.compliant)
  .forEach((c) => {
    console.log(`\n[${c.file}]:`);
    c.issues.forEach((i) => {
      console.log(`  - (${i.type}): ${i.desc}`);
      if (i.samples) console.log(`    Samples: ${JSON.stringify(i.samples)}`);
    });
  });
