'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/header/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation('legal');

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        {/* Page header */}
        <div className="mb-10 border-b border-border pb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t('privacy.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('privacy.subtitle')}</p>
        </div>

        {/* Preamble */}
        <p className="mb-10 leading-relaxed text-foreground/90">{t('privacy.preamble')}</p>

        {/* Section 1 — Data Controller */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.controller.title')}
          </h2>
          <p className="mb-3 leading-relaxed text-foreground/90">
            {t('privacy.sections.controller.p1')}
          </p>
          <p className="leading-relaxed text-foreground/90">
            {t('privacy.sections.controller.p2')}
          </p>
        </section>

        {/* Section 2 — Data Collected */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.dataCollected.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('privacy.sections.dataCollected.intro')}
          </p>
          <div className="space-y-4 pl-4">
            {(
              [
                'account',
                'profile',
                'documents',
                'health',
                'emergency',
                'loyalty',
                'activity',
                'technical',
              ] as const
            ).map((key) => (
              <div key={key}>
                <h3 className="mb-1 font-medium text-foreground">
                  {t(`privacy.sections.dataCollected.${key}.title`)}
                </h3>
                <p className="leading-relaxed text-foreground/80">
                  {t(`privacy.sections.dataCollected.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — Purposes */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.purposes.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('privacy.sections.purposes.intro')}
          </p>
          <ul className="space-y-2 pl-4">
            {(
              [
                'auth',
                'profile',
                'trips',
                'gamification',
                'notifications',
                'sharing',
                'export',
                'support',
                'legal',
              ] as const
            ).map((key) => (
              <li key={key} className="flex gap-2 leading-relaxed text-foreground/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {t(`privacy.sections.purposes.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 4 — Sensitive Data */}
        <section className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800/40 dark:bg-amber-950/20">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.sensitiveData.title')}
          </h2>
          {(['p1', 'p2', 'p3', 'p4'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`privacy.sections.sensitiveData.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 5 — Third Parties */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.thirdParties.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('privacy.sections.thirdParties.p1')}
          </p>
          <div className="space-y-4 pl-4">
            <div>
              <h3 className="mb-1 font-medium text-foreground">
                {t('privacy.sections.thirdParties.googleTitle')}
              </h3>
              <p className="leading-relaxed text-foreground/80">
                {t('privacy.sections.thirdParties.googleBody')}
              </p>
            </div>
            <div>
              <h3 className="mb-1 font-medium text-foreground">
                {t('privacy.sections.thirdParties.facebookTitle')}
              </h3>
              <p className="leading-relaxed text-foreground/80">
                {t('privacy.sections.thirdParties.facebookBody')}
              </p>
            </div>
          </div>
          <p className="mt-4 leading-relaxed text-foreground/90">
            {t('privacy.sections.thirdParties.noSale')}
          </p>
        </section>

        {/* Section 6 — International Transfers */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.internationalTransfers.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`privacy.sections.internationalTransfers.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 7 — Minors */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.minors.title')}
          </h2>
          {(['p1', 'p2'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`privacy.sections.minors.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 8 — Retention */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.retention.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`privacy.sections.retention.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 9 — Rights */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.rights.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('privacy.sections.rights.intro')}
          </p>
          <ul className="mb-4 space-y-2 pl-4">
            {(
              ['access', 'correction', 'deletion', 'revocation', 'complaint', 'freeAccess'] as const
            ).map((key) => (
              <li key={key} className="flex gap-2 leading-relaxed text-foreground/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {t(`privacy.sections.rights.${key}`)}
              </li>
            ))}
          </ul>
          <p className="leading-relaxed text-foreground/90">{t('privacy.sections.rights.howTo')}</p>
        </section>

        {/* Section 10 — Security */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.security.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('privacy.sections.security.intro')}
          </p>
          <ul className="space-y-2 pl-4">
            {(['https', 'auth', 'secrets', 'audit', 'rbac', 'sensitive'] as const).map((key) => (
              <li key={key} className="flex gap-2 leading-relaxed text-foreground/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {t(`privacy.sections.security.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 11 — Organizer Export */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.organizers.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`privacy.sections.organizers.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 12 — Changes */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.changes.title')}
          </h2>
          {(['p1', 'p2'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`privacy.sections.changes.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 13 — Contact */}
        <section className="mb-12 rounded-lg border border-border bg-muted/40 p-5">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('privacy.sections.contact.title')}
          </h2>
          <p className="mb-3 leading-relaxed text-foreground/90">
            {t('privacy.sections.contact.p1')}
          </p>
          <a
            href="mailto:admin@chamucotravel.com"
            className="mb-3 block font-medium text-primary hover:underline"
          >
            {t('privacy.sections.contact.email')}
          </a>
          <p className="leading-relaxed text-foreground/90">{t('privacy.sections.contact.p2')}</p>
        </section>

        {/* Footer navigation */}
        <div className="flex flex-col items-start gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t('backToSignIn')}
          </Link>
          <Link
            href="/terms-of-service"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t('terms.title')}
          </Link>
        </div>
      </main>
    </div>
  );
}
