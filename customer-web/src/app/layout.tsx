import type { Metadata } from 'next';
import Script from 'next/script';
import { Suspense } from 'react';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { SiteSettingsProvider } from '@/lib/site-settings';
import { AnalyticsPageView } from '@/components/analytics/AnalyticsPageView';
import { GA_MEASUREMENT_ID } from '@/lib/analytics';

const DEFAULT_TITLE = 'OpenMarketplace';
const DEFAULT_DESCRIPTION = 'Local classifieds marketplace';

// Do not fetch public site settings in the server root layout. That would run
// again on direct child-page loads. The homepage client refreshes settings and
// stores them in sessionStorage; every child page reuses that cached branding.
export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  applicationName: DEFAULT_TITLE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteSettingsProvider>
          <SiteHeader />
          <main className="page-shell">{children}</main>
          <MobileBottomNav />
          <SiteFooter />
          <Suspense fallback={null}><AnalyticsPageView /></Suspense>
        </SiteSettingsProvider>

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          `}
        </Script>
      </body>
    </html>
  );
}
