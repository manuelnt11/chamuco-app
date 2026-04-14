'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/header/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function TermsOfServicePage() {
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
            {t('terms.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('terms.subtitle')}</p>
        </div>

        {/* Preamble */}
        <p className="mb-10 leading-relaxed text-foreground/90">{t('terms.preamble')}</p>

        {/* Section 1 — Acceptance */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.acceptance.title')}
          </h2>
          {(['p1', 'p2'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.acceptance.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 2 — Service */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.service.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.service.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 3 — Eligibility */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.eligibility.title')}
          </h2>
          {(['p1', 'p2'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.eligibility.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 4 — Account */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.account.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.account.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 5 — Acceptable Use */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.acceptableUse.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('terms.sections.acceptableUse.intro')}
          </p>
          <ul className="mb-4 space-y-2 pl-4">
            {(
              [
                'illegal',
                'impersonation',
                'harmful',
                'unauthorized',
                'spam',
                'scraping',
                'interference',
              ] as const
            ).map((key) => (
              <li key={key} className="flex gap-2 leading-relaxed text-foreground/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {t(`terms.sections.acceptableUse.${key}`)}
              </li>
            ))}
          </ul>
          <p className="leading-relaxed text-foreground/90">
            {t('terms.sections.acceptableUse.consequences')}
          </p>
        </section>

        {/* Section 6 — Expenses */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.expenses.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.expenses.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 7 — IP */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.ip.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.ip.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 8 — Gamification */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.gamification.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.gamification.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 9 — Notifications */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.notifications.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('terms.sections.notifications.p1')}
          </p>
          <p className="mb-2 font-medium text-foreground">
            {t('terms.sections.notifications.transactionalTitle')}
          </p>
          <ul className="mb-4 space-y-2 pl-4">
            {(
              [
                'trips',
                'feedback',
                'passport',
                'gamification',
                'keyDates',
                'announcements',
              ] as const
            ).map((key) => (
              <li key={key} className="flex gap-2 leading-relaxed text-foreground/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {t(`terms.sections.notifications.transactional.${key}`)}
              </li>
            ))}
          </ul>
          <p className="mb-2 font-medium text-foreground">
            {t('terms.sections.notifications.platformTitle')}
          </p>
          <ul className="mb-4 space-y-2 pl-4">
            {(['news', 'promotional'] as const).map((key) => (
              <li key={key} className="flex gap-2 leading-relaxed text-foreground/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {t(`terms.sections.notifications.platform.${key}`)}
              </li>
            ))}
          </ul>
          {(['p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.notifications.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 10 — Privacy */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.privacy.title')}
          </h2>
          <p className="mb-3 leading-relaxed text-foreground/90">
            {t('terms.sections.privacy.p1')}
          </p>
          <p className="leading-relaxed text-foreground/90">{t('terms.sections.privacy.p2')}</p>
        </section>

        {/* Section 11 — Liability */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.liability.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('terms.sections.liability.intro')}
          </p>
          <ul className="mb-4 space-y-2 pl-4">
            {(['decisions', 'userContent', 'service', 'financial', 'agreements'] as const).map(
              (key) => (
                <li key={key} className="flex gap-2 leading-relaxed text-foreground/80">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  {t(`terms.sections.liability.${key}`)}
                </li>
              ),
            )}
          </ul>
          <p className="leading-relaxed text-foreground/90">
            {t('terms.sections.liability.caveat')}
          </p>
        </section>

        {/* Section 12 — Termination */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.termination.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.termination.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 13 — Modifications */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.modifications.title')}
          </h2>
          {(['p1', 'p2'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.modifications.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 14 — Governing Law */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.governingLaw.title')}
          </h2>
          {(['p1', 'p2', 'p3'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`terms.sections.governingLaw.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 15 — Contact */}
        <section className="mb-12 rounded-lg border border-border bg-muted/40 p-5">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('terms.sections.contact.title')}
          </h2>
          <p className="mb-3 leading-relaxed text-foreground/90">
            {t('terms.sections.contact.p1')}
          </p>
          <a
            href="mailto:admin@chamucotravel.com"
            className="mb-3 block font-medium text-primary hover:underline"
          >
            {t('terms.sections.contact.email')}
          </a>
          <p className="leading-relaxed text-foreground/90">{t('terms.sections.contact.p2')}</p>
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
            href="/privacy-policy"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t('privacy.title')}
          </Link>
        </div>
      </main>
    </div>
  );
}
