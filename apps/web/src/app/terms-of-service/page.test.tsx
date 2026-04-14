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

import TermsOfServicePage from './page';

describe('TermsOfServicePage', () => {
  beforeEach(() => {
    render(<TermsOfServicePage />);
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
    it('renders an h1 with the terms title key', () => {
      expect(screen.getByRole('heading', { level: 1, name: 'terms.title' })).toBeInTheDocument();
    });
  });

  describe('sections', () => {
    it('renders all 15 section headings', () => {
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(15);
    });

    it('renders the Acceptance section', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'terms.sections.acceptance.title' }),
      ).toBeInTheDocument();
    });

    it('renders the Communications and Notifications section', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'terms.sections.notifications.title' }),
      ).toBeInTheDocument();
    });

    it('renders the Governing Law section', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'terms.sections.governingLaw.title' }),
      ).toBeInTheDocument();
    });

    it('renders the Contact section', () => {
      expect(
        screen.getByRole('heading', { level: 2, name: 'terms.sections.contact.title' }),
      ).toBeInTheDocument();
    });
  });

  describe('contact', () => {
    it('renders a mailto link with the correct contact email', () => {
      const link = screen.getByRole('link', { name: 'terms.sections.contact.email' });
      expect(link).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
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
