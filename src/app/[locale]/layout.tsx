import { Inter, Poppins } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import Header from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sooner';
import { AIAssistantTrigger } from '@/components/ai/AIAssistantTrigger';
import { AIAssistantProvider } from '@/components/ai/AIAssistantContext';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale: locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'meta' });

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <title>{t('title')}</title>
        <meta name="description" content={t('description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.png?v=2" sizes="32x32" type="image/png" />
        <link rel="alternate icon" href="/favicon.ico?v=2" />
      </head>
      <body className="h-screen overflow-hidden flex flex-col bg-background">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              <QueryProvider>
                <AIAssistantProvider>
                  <Header />
                  <AppShell>
                    {children}
                  </AppShell>
                  <AIAssistantTrigger />
                  <Toaster />
                </AIAssistantProvider>
              </QueryProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

