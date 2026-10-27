import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Moon, Sun, Type } from 'lucide-react';
import { FONTS, applyFont, applyTheme, getInitialFont, getInitialTheme } from '../utils/theme';

export default function ThemeFontToolbar({ className = '', light = false, dropUp = true }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [currentFont, setCurrentFont] = useState(getInitialFont);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    // Listen for custom font change events from any toolbar instance
    const onFontChange = (e) => {
      const nextFont = e.detail || getInitialFont();
      setCurrentFont(nextFont);
    };

    // Listen for custom theme change events
    const onThemeChange = (e) => {
      const nextTheme = e.detail || getInitialTheme();
      setTheme(nextTheme);
    };

    // Listen for cross-tab or external storage changes
    const onStorage = (e) => {
      if (e.key === 'alumniconnect_font') {
        const nextFont = getInitialFont();
        setCurrentFont(nextFont);
        applyFont(nextFont);
      }
      if (e.key === 'alumniconnect_theme') {
        const nextTheme = getInitialTheme();
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }
    };

    // Close dropdown when clicking outside
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('alumniconnect:font-change', onFontChange);
    window.addEventListener('alumniconnect:theme-change', onThemeChange);
    window.addEventListener('storage', onStorage);
    document.addEventListener('mousedown', onClickOutside);

    return () => {
      window.removeEventListener('alumniconnect:font-change', onFontChange);
      window.removeEventListener('alumniconnect:theme-change', onThemeChange);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleFontChange = (fontId) => {
    setCurrentFont(fontId);
    applyFont(fontId);
  };

  const currentFontObj = FONTS.find((f) => f.id === currentFont) || FONTS[0];

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  if (light) {
    return (
      <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
        {/* Hidden accessible select for automated scanners & screen readers */}
        <select
          value={currentFont}
          onChange={(e) => handleFontChange(e.target.value)}
          aria-label="Select website font family"
          className="sr-only"
          tabIndex={-1}
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Custom Font Selector Dropdown */}
        <div ref={dropdownRef} className="relative flex-1 min-w-0">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={handleKeyDown}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label="Select website font family"
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs font-semibold text-white backdrop-blur shadow-xs transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          >
            <Type className="h-3.5 w-3.5 shrink-0 text-white/80" />
            <span className="truncate flex-1 text-left">{currentFontObj.label}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-white/80 transition-transform duration-150 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div
              role="listbox"
              aria-label="Font family options"
              className={`absolute ${
                dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
              } left-0 w-full z-50 rounded-lg border border-white/20 bg-slate-900/95 p-1 shadow-xl backdrop-blur-md`}
            >
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="option"
                  aria-selected={currentFont === f.id}
                  onClick={() => {
                    handleFontChange(f.id);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  style={{ fontFamily: f.value }}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs transition ${
                    currentFont === f.id
                      ? 'bg-teal-600 font-bold text-white shadow-xs'
                      : 'text-slate-200 hover:bg-white/10 font-medium'
                  }`}
                >
                  <span className="flex flex-col gap-0.5 text-left">
                    <span className="truncate text-xs font-semibold">{f.label}</span>
                    <span
                      className={`text-[10px] tracking-wide ${
                        currentFont === f.id ? 'text-teal-100' : 'text-slate-400'
                      }`}
                      style={{ fontFamily: f.value }}
                    >
                      {f.preview} — Aa Bb Cc
                    </span>
                  </span>
                  {currentFont === f.id && <Check className="h-3.5 w-3.5 shrink-0 text-white ml-1.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 shadow-xs transition focus-visible:outline-2 focus-visible:outline-white"
        >
          {theme === 'dark' ? <Moon className="h-4 w-4 text-amber-300" /> : <Sun className="h-4 w-4 text-white" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Hidden accessible select for automated scanners & screen readers */}
      <select
        value={currentFont}
        onChange={(e) => handleFontChange(e.target.value)}
        aria-label="Select website font family"
        className="sr-only"
        tabIndex={-1}
      >
        {FONTS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Font Selector Custom Dropdown */}
      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Select website font family"
          className={`flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200/90 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/70 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${
            isOpen ? 'ring-2 ring-brand-500/30 border-brand-500/50 dark:border-brand-400/50' : ''
          }`}
        >
          <Type className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-400" />
          <span className="truncate flex-1 text-left">{currentFontObj.label}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label="Font family options"
            className={`absolute ${
              dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } left-0 w-full z-50 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800`}
          >
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="option"
                aria-selected={currentFont === f.id}
                onClick={() => {
                  handleFontChange(f.id);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                style={{ fontFamily: f.value }}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs transition ${
                  currentFont === f.id
                    ? 'bg-brand-50 font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60 font-medium'
                }`}
              >
                <span className="flex flex-col gap-0.5 text-left">
                  <span className="truncate text-xs font-semibold">{f.label}</span>
                  <span
                    className={`text-[10px] tracking-wide ${
                      currentFont === f.id
                        ? 'text-brand-500 dark:text-brand-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                    style={{ fontFamily: f.value }}
                  >
                    {f.preview} — Aa Bb Cc
                  </span>
                </span>
                {currentFont === f.id && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400 ml-1.5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:hover:text-white transition hover:border-slate-300 dark:hover:border-slate-600 focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4 text-amber-300 dark:text-amber-300" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </button>
    </div>
  );
}
