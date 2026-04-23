import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CONTACT_EMAIL } from '@/config/app.constants';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/header/Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('@/components/LanguageToggle', () => ({
  LanguageToggle: () => <button data-testid="language-toggle">Lang</button>,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import AccountDeletionPage from './page';

describe('AccountDeletionPage', () => {
  beforeEach(() => {
    render(<AccountDeletionPage />);
  });

  describe('header', () => {
    it('renders the logo', () => {
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('renders the language toggle', () => {
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
    });

    it('renders the theme toggle', () => {
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('page title', () => {
    it('renders an h1 with the account deletion title key', () => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'accountDeletion.title' }),
      ).toBeInTheDocument();
    });
  });

  describe('sections', () => {
    it('renders all 4 section headings', () => {
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
    });

    it('renders the What Gets Deleted section', () => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'accountDeletion.sections.whatGetsDeleted.title',
        }),
      ).toBeInTheDocument();
    });

    it('renders the How to Request section', () => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'accountDeletion.sections.howToRequest.title',
        }),
      ).toBeInTheDocument();
    });

    it('renders the Retention section', () => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'accountDeletion.sections.retention.title',
        }),
      ).toBeInTheDocument();
    });

    it('renders the Contact section', () => {
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'accountDeletion.sections.contact.title',
        }),
      ).toBeInTheDocument();
    });
  });

  describe('contact links', () => {
    it('renders mailto links with the correct contact email', () => {
      const links = screen
        .getAllByRole('link')
        .filter((link) => link.getAttribute('href')?.startsWith('mailto:'));
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
      });
    });
  });

  describe('footer navigation', () => {
    it('renders a link back to /sign-in', () => {
      expect(screen.getByRole('link', { name: 'common:actions.backToSignIn' })).toHaveAttribute(
        'href',
        '/sign-in',
      );
    });

    it('renders a cross-link to /privacy-policy', () => {
      expect(screen.getByRole('link', { name: 'privacy.title' })).toHaveAttribute(
        'href',
        '/privacy-policy',
      );
    });
  });
});
