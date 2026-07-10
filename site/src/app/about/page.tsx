'use client';

import { useLocale } from '@/lib/i18n/locale-context';

const team = [
  { name: 'Boyu Qie', role: 'Chemistry/Physics/AI', org: 'UC Berkeley', img: '/guide/images/team/BoyuQie.png' },
  { name: 'Nakul Rampal', role: 'Chemistry/AI', org: 'UC Berkeley', img: '/guide/images/team/NakulRampal.png' },
  { name: 'Zihui Zhou', role: 'Chemistry', org: 'UC Berkeley', img: '/guide/images/team/ZihuiZhou.png' },
  { name: 'Xin Wang', role: 'Chemistry', org: 'UC Berkeley', img: '/guide/images/team/XinWang.png' },
  { name: 'Ziyi Wang', role: 'Chemistry/Physics', org: 'UC Berkeley', img: '/guide/images/team/ZiyiWang.png' },
  { name: 'Rafal Zuzak', role: 'Physics', org: 'UC Berkeley', img: '/guide/images/team/RafalZuzak.png' },
  { name: 'Ping Tuo', role: 'Materials/AI', org: 'UC Berkeley', img: '/guide/images/team/PingTuo.png' },
  { name: 'Eric Qu', role: 'CS/AI', org: 'UC Berkeley', img: '/guide/images/team/EricQu.png' },
  { name: 'Benkai Li', role: '', org: '', img: '/guide/images/team/BenkaiLi.webp' },
];

const orgs = [
  { name: 'UC Berkeley', img: '/guide/images/org/Berkeley.png' },
  { name: 'SUSTech', img: '/guide/images/org/sustech.png' },
  { name: 'BIDS', img: '/guide/images/org/bids.png' },
  { name: 'Jupyter', img: '/guide/images/org/jupyter.png' },
];

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="mb-12 text-3xl font-bold">{t('about.title')}</h1>

      {/* Contributors */}
      <section className="mb-16">
        <h2 className="mb-8 text-xl font-semibold">{t('about.contributors')}</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {team.map((member) => (
            <div key={member.name} className="flex flex-col items-center">
              <div className="mb-3 h-36 w-36 overflow-hidden rounded-full bg-gray-100">
                <img
                  src={member.img}
                  alt={member.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-sm font-medium">{member.name}</p>
              {member.role && (
                <p className="text-xs text-gray-500">{member.role}</p>
              )}
              {member.org && (
                <p className="text-xs text-gray-500">{member.org}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Organizations */}
      <section>
        <h2 className="mb-8 text-xl font-semibold">{t('about.supporters')}</h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {orgs.map((org) => (
            <div key={org.name} className="flex items-center justify-center">
              <img
                src={org.img}
                alt={org.name}
                className="max-h-[4.5rem] max-w-[10.5rem] object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
