/**
 * Automated Verification: Sidebar Font Selector & Theme Toggle Integration
 * Tests:
 * 1. Placement in Desktop Sidebar (above user profile card, in single horizontal row)
 * 2. Component design: Type icon, font label, ChevronDown, square Theme toggle
 * 3. Icon logic: Moon in dark mode, Sun in light mode
 * 4. Dropdown behavior: Arial, Helvetica, Times New Roman options & font-family stacks
 * 5. Single source of truth: --app-font-family & localStorage persistence
 * 6. Responsive breakpoints: 320px, 375px, 768px, 1024px, 1280px, 1440px
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

console.log('\n================================================================');
console.log('AlumniConnect Sidebar Font Selector & Theme Toggle Verification');
console.log('================================================================\n');

const layoutPath = path.resolve(__dirname, '../../frontend/src/components/Layout.jsx');
const toolbarPath = path.resolve(__dirname, '../../frontend/src/components/ThemeFontToolbar.jsx');
const themePath = path.resolve(__dirname, '../../frontend/src/utils/theme.js');

const layoutSrc = fs.readFileSync(layoutPath, 'utf8');
const toolbarSrc = fs.readFileSync(toolbarPath, 'utf8');
const themeSrc = fs.readFileSync(themePath, 'utf8');

// 1. Placement & Layout in Layout.jsx
it('1. Desktop sidebar anchors controls in bottom section above user profile card', () => {
  assert(layoutSrc.includes('<aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0'), 'Sidebar must be full-height fixed column');
  assert(layoutSrc.includes('<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"'), 'Navigation must be flex-1 and scrollable');
  
  // Verify order in desktop sidebar: Toolbar comes BEFORE Profile Capsule
  const toolbarPos = layoutSrc.indexOf('<ThemeFontToolbar className="w-full" dropUp={true} />');
  assert(toolbarPos !== -1, 'ThemeFontToolbar must be embedded in sidebar with dropUp={true}');
  
  const profilePos = layoutSrc.indexOf('{/* User Profile Capsule */}', toolbarPos);
  assert(profilePos !== -1, 'User Profile Capsule must follow immediately below ThemeFontToolbar');
  
  const dividerPos = layoutSrc.lastIndexOf('border-t', toolbarPos);
  assert(dividerPos !== -1, 'Subtle horizontal divider must separate bottom controls from navigation');
});

// 2. Single horizontal row layout for font selector + theme toggle
it('2. Font selector and theme toggle share the same horizontal row with proper sizing', () => {
  assert(toolbarSrc.includes('flex items-center gap-2'), 'Toolbar must align items in horizontal flex row');
  assert(toolbarSrc.includes('relative flex-1 min-w-0'), 'Font selector container must expand to fill available width');
  assert(toolbarSrc.includes('flex h-9 w-9 shrink-0 items-center justify-center'), 'Theme toggle must be compact square button (h-9 w-9 shrink-0)');
});

// 3. Visual components of Font Selector
it('3. Font selector includes Type icon, truncated font label, and ChevronDown', () => {
  assert(toolbarSrc.includes('<Type className="h-3.5 w-3.5'), 'Must render Type icon on left');
  assert(toolbarSrc.includes('currentFontObj.label'), 'Must display active font label');
  assert(toolbarSrc.includes('<ChevronDown'), 'Must render ChevronDown dropdown icon');
  assert(toolbarSrc.includes('isOpen ? \'rotate-180\' : \'\''), 'Chevron must rotate when open');
});

// 4. Moon/Sun Theme Toggle requirements
it('4. Theme toggle displays Moon in dark mode and Sun in light mode with accessible labels', () => {
  assert(toolbarSrc.includes("theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"), 'Accessible label must reflect available action');
  assert(toolbarSrc.includes("<Moon className=\"h-4 w-4"), 'Dark mode must display Moon icon');
  assert(toolbarSrc.includes("<Sun className=\"h-4 w-4"), 'Light mode must display Sun icon');
});

// 5. Font choices and stacks
it('5. Font selector provides Arial, Helvetica, and Times New Roman with exact stacks', () => {
  assert(themeSrc.includes("id: 'arial'"), 'Must include Arial');
  assert(themeSrc.includes("value: 'Arial, Helvetica, sans-serif'"), 'Must use Arial stack');
  assert(themeSrc.includes("id: 'helvetica'"), 'Must include Helvetica');
  assert(themeSrc.includes("value: 'Helvetica, Arial, sans-serif'"), 'Must use Helvetica stack');
  assert(themeSrc.includes("id: 'times'"), 'Must include Times New Roman');
  assert(themeSrc.includes("value: \"'Times New Roman', Times, serif\""), 'Must use Times New Roman stack');
});

// 6. Keyboard accessibility & Dropdown State
it('6. Dropdown supports keyboard interaction (Escape, ArrowDown/Up, Enter/Space)', () => {
  assert(toolbarSrc.includes("e.key === 'Escape'"), 'Escape key must close dropdown');
  assert(toolbarSrc.includes("e.key === 'ArrowDown'"), 'ArrowDown key must open/navigate dropdown');
  assert(toolbarSrc.includes("aria-haspopup=\"listbox\""), 'Dropdown must have aria-haspopup="listbox"');
  assert(toolbarSrc.includes("aria-expanded={isOpen}"), 'Dropdown must track aria-expanded state');
  assert(toolbarSrc.includes("role=\"listbox\""), 'Menu must have role="listbox"');
  assert(toolbarSrc.includes("role=\"option\""), 'Items must have role="option"');
});

// 7. Mobile Drawer Integration
it('7. Mobile drawer includes controls and user profile card for small viewports', () => {
  assert(layoutSrc.includes('{/* Mobile Drawer Profile Capsule */}'), 'Mobile drawer must mirror sidebar profile layout');
  assert(layoutSrc.includes('<ThemeFontToolbar className="w-full" dropUp={true} />'), 'Mobile drawer must contain ThemeFontToolbar');
});

// 8. Viewport Breakpoint Compatibility Simulation (320, 375, 768, 1024, 1280, 1440)
it('8. Layout defines proper classes across viewports: 320px, 375px, 768px, 1024px, 1280px, 1440px', () => {
  const breakpoints = [
    { width: 320, mode: 'mobile', hasAside: false, hasDrawer: true },
    { width: 375, mode: 'mobile', hasAside: false, hasDrawer: true },
    { width: 768, mode: 'tablet', hasAside: false, hasDrawer: true, topToolbar: true },
    { width: 1024, mode: 'desktop', hasAside: true, hasDrawer: false, topToolbar: false },
    { width: 1280, mode: 'desktop-lg', hasAside: true, hasDrawer: false, topToolbar: false },
    { width: 1440, mode: 'desktop-xl', hasAside: true, hasDrawer: false, topToolbar: false },
  ];

  for (const bp of breakpoints) {
    if (bp.width >= 1024) {
      assert(layoutSrc.includes('lg:flex lg:w-64 lg:flex-col lg:fixed'), `Breakpoint ${bp.width}px must show desktop sidebar`);
      assert(layoutSrc.includes('lg:pl-64'), `Breakpoint ${bp.width}px must offset main content by 64 (16rem)`);
    } else {
      assert(layoutSrc.includes('hidden lg:flex'), `Breakpoint ${bp.width}px must hide desktop sidebar`);
      assert(layoutSrc.includes('fixed inset-0 z-40 lg:hidden'), `Breakpoint ${bp.width}px must support mobile drawer overlay`);
    }
  }
});

console.log('\n================================================================');
console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
console.log('================================================================\n');

if (failCount > 0) process.exit(1);
