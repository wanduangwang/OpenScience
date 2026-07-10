'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useLocale } from '@/lib/i18n/locale-context';
import { localeNames, locales } from '@/lib/i18n/dictionary';

export function Header() {
  const { t, locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  const guideHref = locale === 'en' ? '/guide/en/intro-en/' : '/guide/zh/intro-zh/';

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: guideHref, label: t('nav.guide') },
    { href: '/about', label: t('nav.about') },
  ];

  const projects = [
    { label: t('project.generalChemistry'), url: 'https://openscienceteam.github.io/General-Chemistry/' },
    { label: t('project.aiForMaterials'), url: 'https://openscienceteam.github.io/aiforscience/' },
    { label: t('project.electrochemistry'), url: 'https://openscienceteam.github.io/electrochemical/' },
    { label: t('project.quantumMechanics'), url: 'https://openscienceteam.github.io/Quantum-Mechanics/' },
  ];

  // toggleLanguage removed - language selector is now a dropdown

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: '#013243', borderColor: '#1a5063' }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-medium tracking-tight text-white"
        >
          Open Science
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {/* External projects dropdown */}
          <div className="relative ml-2">
            <button className="rounded-md px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white peer">
              {t('nav.projects')}
            </button>
            <div className="absolute right-0 w-56 pt-2 opacity-0 invisible transition-all peer-hover:opacity-100 peer-hover:visible hover:opacity-100 hover:visible">
              <div className="rounded-lg border bg-white p-1.5 shadow-lg -mt-1">
              {projects.map((p) => (
                <Link
                  key={p.url}
                  href={p.url}
                  className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
          </div>

          {/* Language dropdown selector */}
          <div className="relative ml-3">
            <button className="rounded-md px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white border border-white/30 peer">
              {localeNames[locale]} <span className="ml-0.5 opacity-60">▾</span>
            </button>
            <div className="absolute right-0 pt-2 opacity-0 invisible transition-all peer-hover:opacity-100 peer-hover:visible hover:opacity-100 hover:visible">
              <div className="rounded-lg border bg-white p-1 shadow-lg -mt-1 min-w-[8rem]">
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={`block w-full rounded-md px-3 py-1.5 text-sm text-left transition-colors ${
                      l === locale
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {localeNames[l]}
                    {l === locale && <span className="float-right opacity-50">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile menu trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10 w-10 h-10 sm:hidden"
            aria-label={t('nav.openMenu')}
          >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </SheetTrigger>
          <SheetContent side="right" className="w-64 pt-12">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t pt-2">
                <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('nav.projects')}
                </p>
                {projects.map((p) => (
                  <Link
                    key={p.url}
                    href={p.url}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
              {/* Mobile language selector */}
              <div className="mt-2 border-t pt-2">
                <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language
                </p>
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLocale(l); setOpen(false); }}
                    className={`w-full rounded-md px-3 py-2 text-sm text-left ${
                      l === locale
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {localeNames[l]}
                    {l === locale && <span className="float-right opacity-50">✓</span>}
                  </button>
                ))}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
