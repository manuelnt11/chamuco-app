'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { CONTACT_EMAIL } from '@/config/app.constants';
import { Logo } from '@/components/header/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AccountDeletionPage() {
  const { t } = useTranslation(['legal', 'common']);

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
            {t('accountDeletion.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('accountDeletion.subtitle')}</p>
        </div>

        {/* Intro */}
        <p className="mb-10 leading-relaxed text-foreground/90">{t('accountDeletion.intro')}</p>

        {/* Section 1 — What Gets Deleted */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('accountDeletion.sections.whatGetsDeleted.title')}
          </h2>
          <p className="mb-4 leading-relaxed text-foreground/90">
            {t('accountDeletion.sections.whatGetsDeleted.intro')}
          </p>
          <ul className="space-y-2 pl-4">
            {(
              [
                'account',
                'profile',
                'documents',
                'preferences',
                'tripHistory',
                'gamification',
              ] as const
            ).map((key) => (
              <li key={key} className="flex gap-2 leading-relaxed text-foreground/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {t(`accountDeletion.sections.whatGetsDeleted.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 2 — How to Request */}
        <section className="mb-8 rounded-lg border border-border bg-muted/40 p-5">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('accountDeletion.sections.howToRequest.title')}
          </h2>
          <p className="mb-3 leading-relaxed text-foreground/90">
            {t('accountDeletion.sections.howToRequest.p1')}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="block font-medium text-primary hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </section>

        {/* Section 3 — Retention */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('accountDeletion.sections.retention.title')}
          </h2>
          {(['p1', 'p2'] as const).map((p) => (
            <p key={p} className="mb-3 leading-relaxed text-foreground/90 last:mb-0">
              {t(`accountDeletion.sections.retention.${p}`)}
            </p>
          ))}
        </section>

        {/* Section 4 — Contact */}
        <section className="mb-12 rounded-lg border border-border bg-muted/40 p-5">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {t('accountDeletion.sections.contact.title')}
          </h2>
          <p className="mb-3 leading-relaxed text-foreground/90">
            {t('accountDeletion.sections.contact.p1')}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mb-3 block font-medium text-primary hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="leading-relaxed text-foreground/90">
            {t('accountDeletion.sections.contact.p2')}
          </p>
        </section>

        {/* Footer navigation */}
        <div className="flex flex-col items-start gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t('common:actions.backToSignIn')}
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
