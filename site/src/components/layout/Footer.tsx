'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/locale-context';

export function Footer() {
  const { t } = useLocale();

  return (
    <footer
      className="mt-auto py-6 text-sm text-white/80"
      style={{ backgroundColor: '#013243' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center sm:text-left">
            <em>{t('footer.text')}</em>
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/OpenScienceTeam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 transition-colors hover:text-white"
            >
              {t('footer.github')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
