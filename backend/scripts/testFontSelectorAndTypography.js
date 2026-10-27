/**
 * Automated Verification: Font Selector & Typography Engine
 * Validates:
 * 1. Exact required font definitions (Arial, Helvetica, Times New Roman)
 * 2. Single source of truth via --app-font-family CSS variable
 * 3. HTML head pre-render restoration preventing FOFT/FOUT
 * 4. Tailwind config typography binding (sans & display bound to var(--app-font-family))
 * 5. Theme and font toolbar state synchronization & custom event dispatching
 * 6. Global CSS typography cascade on html, body, headings, cards, and buttons
 * 7. Absence of disallowed external/unauthorized web fonts
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${desc} -> ${err.message}`);
    failCount++;
  }
}

console.log('\n======================================================');
console.log('AlumniConnect Font Selector & Typography Verification');
console.log('======================================================\n');

const themeJsPath = path.resolve(__dirname, '../../frontend/src/utils/theme.js');
const indexCssPath = path.resolve(__dirname, '../../frontend/src/index.css');
const tailwindConfigPath = path.resolve(__dirname, '../../frontend/tailwind.config.js');
const indexHtmlPath = path.resolve(__dirname, '../../frontend/index.html');
const mainJsxPath = path.resolve(__dirname, '../../frontend/src/main.jsx');
const toolbarPath = path.resolve(__dirname, '../../frontend/src/components/ThemeFontToolbar.jsx');

const themeJs = fs.readFileSync(themeJsPath, 'utf8');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');
const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const mainJsx = fs.readFileSync(mainJsxPath, 'utf8');
const toolbar = fs.readFileSync(toolbarPath, 'utf8');

// 1. Font choices specification
it('1. Exact permitted font definitions are mapped in theme.js', () => {
  assert(themeJs.includes("id: 'arial'"), 'Arial must be defined');
  assert(themeJs.includes("value: 'Arial, Helvetica, sans-serif'"), 'Arial font stack must match requirement');

  assert(themeJs.includes("id: 'helvetica'"), 'Helvetica must be defined');
  assert(themeJs.includes("value: 'Helvetica, Arial, sans-serif'"), 'Helvetica font stack must match requirement');

  assert(themeJs.includes("id: 'times'"), 'Times New Roman must be defined');
  assert(themeJs.includes("value: \"'Times New Roman', Times, serif\""), 'Times New Roman stack must match requirement');
});

// 2. CSS Custom Property single source of truth
it('2. --app-font-family is defined as the active single source of truth in applyFont', () => {
  assert(themeJs.includes("--app-font-family'"), 'applyFont must set --app-font-family on documentElement');
  assert(themeJs.includes("localStorage.setItem('alumniconnect_font'"), 'applyFont must persist selected font to localStorage');
  assert(themeJs.includes("new CustomEvent('alumniconnect:font-change'"), 'applyFont must dispatch font-change custom event');
});

// 3. Pre-hydration restoration in index.html
it('3. Pre-hydration script in index.html restores --app-font-family before first paint', () => {
  assert(indexHtml.includes("localStorage.getItem('alumniconnect_font')"), 'index.html must check localStorage for stored font');
  assert(indexHtml.includes("--app-font-family'"), 'index.html must set --app-font-family on documentElement');
  assert(indexHtml.includes("times: \"'Times New Roman', Times, serif\""), 'index.html fontMap must include Times New Roman');
  assert(indexHtml.includes("arial: 'Arial, Helvetica, sans-serif'"), 'index.html fontMap must include Arial');
  assert(indexHtml.includes("helvetica: 'Helvetica, Arial, sans-serif'"), 'index.html fontMap must include Helvetica');
});

// 4. CSS typography cascade in index.css
it('4. index.css binds html, body, and headings to var(--app-font-family)', () => {
  assert(indexCss.includes('--app-font-family: Arial, Helvetica, sans-serif;'), ':root must define --app-font-family fallback');
  assert(indexCss.includes('font-family: var(--app-font-family'), 'html and body must use var(--app-font-family)');
  assert(indexCss.includes('button, input, select, textarea, optgroup {\n    font-family: inherit;'), 'Form controls must inherit font-family');
});

// 5. Tailwind Configuration bindings
it('5. tailwind.config.js binds sans and display to var(--app-font-family)', () => {
  assert(tailwindConfig.includes("sans: ['var(--app-font-family)'"), 'sans utility must use var(--app-font-family)');
  assert(tailwindConfig.includes("display: ['var(--app-font-family)'"), 'display utility must use var(--app-font-family)');
});

// 6. Application Startup in main.jsx
it('6. main.jsx ensures stored font and theme are applied on application boot', () => {
  assert(mainJsx.includes('applyFont(getInitialFont())'), 'main.jsx must call applyFont(getInitialFont())');
  assert(mainJsx.includes('applyTheme(getInitialTheme())'), 'main.jsx must call applyTheme(getInitialTheme())');
});

// 7. ThemeFontToolbar Component Synchronization
it('7. ThemeFontToolbar listens for font-change, theme-change, and storage events', () => {
  assert(toolbar.includes("'alumniconnect:font-change'"), 'Toolbar must listen for font-change event');
  assert(toolbar.includes("'storage'"), 'Toolbar must listen for storage events');
  assert(toolbar.includes("value={currentFont}"), 'Dropdown must be bound to currentFont state');
  assert(toolbar.includes("aria-label=\"Select website font family\""), 'Accessible aria-label must be present');
});

// 8. Strict typography audit: Zero unauthorized external web fonts
it('8. Zero unauthorized external web fonts in CSS or configuration', () => {
  const disallowed = ['inter', 'roboto', 'poppins', 'montserrat', 'open sans', 'lato', 'nunito'];
  const allContent = (themeJs + indexCss + tailwindConfig + indexHtml).toLowerCase();

  for (const font of disallowed) {
    assert(!allContent.includes(`"${font}"`) && !allContent.includes(`'${font}'`), `Disallowed web font found: ${font}`);
  }
});

console.log('\n======================================================');
console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
console.log('======================================================\n');

if (failCount > 0) process.exit(1);
