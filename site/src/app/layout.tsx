import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FloatingPanel } from '@/components/layout/FloatingPanel';
import { LocaleProvider } from '@/lib/i18n/locale-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Open Science',
  description:
    'An open-source knowledge database for STEM learning in the AI era. Interactive, multilingual, and free for everyone.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <LocaleProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <FloatingPanel />
        </LocaleProvider>
      </body>
    </html>
  );
}
