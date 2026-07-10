'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale, Dictionary } from './dictionary';
import { getDictionary, locales } from './dictionary';

const STORAGE_KEY = 'os-locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Dictionary) => string;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  // On mount, read from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && locales.includes(stored)) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  // Sync <html lang> with current locale
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const dict = getDictionary(locale);

  const t = useCallback(
    (key: keyof Dictionary): string => {
      return dict[key];
    },
    [dict]
  );

  // Prevent hydration mismatch by not rendering locale-dependent content until mounted
  if (!mounted) {
    // Return a placeholder with the same structure but a dummy dictionary
    return (
      <LocaleContext.Provider value={{ locale: 'en', setLocale, t, dict }}>
        {children}
      </LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}
