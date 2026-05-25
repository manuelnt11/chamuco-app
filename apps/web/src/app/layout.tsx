import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { I18nProvider } from '@/components/I18nProvider';
import { AppShell } from '@/components/layout';
import { PreferencesSync } from '@/components/PreferencesSync';
import { PushNotificationsInit } from '@/components/push-notifications/PushNotificationsInit';
import { IosPwaPrompt } from '@/components/IosPwaPrompt';
import { AuthProvider } from '@/store/auth';
import { UserProvider } from '@/store/user';
import { ToastProvider } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { SIDEBAR_STORAGE_KEY, SIDEBAR_COLLAPSED_WIDTH } from '@/lib/sidebar-constants';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#38BDF8',
};

export const metadata: Metadata = {
  title: 'Chamuco Travel',
  description: 'Group travel management platform',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Chamuco',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('font-sans', plusJakartaSans.variable)}>
      <body>
        <Script
          id="sidebar-width-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('${SIDEBAR_STORAGE_KEY}')==='true'){document.documentElement.style.setProperty('--layout-sidebar-width','${SIDEBAR_COLLAPSED_WIDTH}')}}catch(_){}`,
          }}
        />
        <ServiceWorkerRegistration />
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey="chamuco-theme"
            scriptProps={{ async: true }}
          >
            <ToastProvider>
              <AuthProvider>
                <UserProvider>
                  <PreferencesSync />
                  <PushNotificationsInit />
                  <AppShell>{children}</AppShell>
                </UserProvider>
              </AuthProvider>
              <IosPwaPrompt />
            </ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
