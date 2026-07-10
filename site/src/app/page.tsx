'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/locale-context';

export default function HomePage() {
  const { t, locale } = useLocale();
  const guideHref = locale === 'en' ? '/guide/en/intro-en' : '/guide/zh/intro-zh';

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-20 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {t('home.hero.title')} <span style={{ color: '#013243' }}>{t('home.hero.titleHighlight')}</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
          {t('home.hero.subtitle')}
        </p>
        <Link
          href={guideHref}
          className="inline-block rounded-lg px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#013243' }}
        >
          {t('home.hero.cta')}
        </Link>
      </section>

      {/* About */}
      <section className="mb-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-2xl font-semibold">{t('home.about.title')}</h2>
          <p className="text-gray-600 leading-relaxed">{t('home.about.body')}</p>
        </div>
      </section>

      {/* Goals */}
      <section className="mb-20">
        <h2 className="mb-8 text-center text-2xl font-semibold">{t('home.goals.title')}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: t('home.goals.open.title'), desc: t('home.goals.open.desc') },
            { title: t('home.goals.community.title'), desc: t('home.goals.community.desc') },
            { title: t('home.goals.global.title'), desc: t('home.goals.global.desc') },
          ].map((goal) => (
            <div
              key={goal.title}
              className="rounded-2xl border p-6 text-center"
              style={{
                borderColor: 'rgba(1, 50, 67, 0.12)',
                boxShadow: '0 0.75rem 2rem rgba(1, 50, 67, 0.08)',
              }}
            >
              <h3
                className="mb-2 text-base font-bold"
                style={{ color: '#013243' }}
              >
                {goal.title}
              </h3>
              <p className="text-sm text-gray-600">{goal.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <h2 className="mb-8 text-center text-2xl font-semibold">{t('home.projects.title')}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: t('home.projects.writingGuide'), url: guideHref },
            { title: 'General Chemistry', url: 'https://openscienceteam.github.io/General-Chemistry/' },
            { title: 'AI for Materials Science', url: 'https://openscienceteam.github.io/aiforscience/' },
            { title: 'Electrochemistry', url: 'https://openscienceteam.github.io/electrochemical/' },
            { title: 'Quantum Mechanics', url: 'https://openscienceteam.github.io/Quantum-Mechanics/' },
          ].map((project) => (
            <a
              key={project.title}
              href={project.url}
              target={project.url.startsWith('http') ? '_blank' : undefined}
              rel={project.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="block rounded-2xl border p-6 text-center transition-shadow hover:shadow-lg"
              style={{
                borderColor: 'rgba(1, 50, 67, 0.12)',
                boxShadow: '0 0.75rem 2rem rgba(1, 50, 67, 0.08)',
              }}
            >
              <h3
                className="text-base font-bold"
                style={{ color: '#013243' }}
              >
                {project.title}
              </h3>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
