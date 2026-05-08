import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { GroupVisibility } from '@chamuco/shared-types';
import type { Group } from '@/types/group';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@chamuco/shared-utils', () => ({
  getTwemojiUrl: (emoji: string) => `https://twemoji.example.com/${emoji}.svg`,
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { GroupCard } from './GroupCard';

const emojiGroup: Group = {
  id: 'group-1',
  name: 'Mountain Crew',
  description: 'A hiking group',
  cover: {
    id: 'asset-1',
    type: 'text',
    source: 'emoji',
    target: '🏔️',
    isPublic: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    url: 'https://twemoji.example.com/🏔️.svg',
  },
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const imageGroup: Group = {
  ...emojiGroup,
  id: 'group-2',
  visibility: GroupVisibility.PRIVATE,
  cover: {
    id: 'asset-2',
    type: 'image',
    source: 'gcs',
    target: 'group-covers/group-2/cover.jpg',
    isPublic: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    url: 'https://storage.googleapis.com/bucket/group-covers/group-2/cover.jpg',
  },
};

describe('GroupCard', () => {
  describe('rendering', () => {
    it('renders group name', () => {
      render(<GroupCard group={emojiGroup} />);
      expect(screen.getByText('Mountain Crew')).toBeInTheDocument();
    });

    it('renders description when present', () => {
      render(<GroupCard group={emojiGroup} />);
      expect(screen.getByText('A hiking group')).toBeInTheDocument();
    });

    it('does not render description when null', () => {
      render(<GroupCard group={{ ...emojiGroup, description: null }} />);
      expect(screen.queryByText('A hiking group')).not.toBeInTheDocument();
    });

    it('renders twemoji img for emoji cover', () => {
      render(<GroupCard group={emojiGroup} />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('src', 'https://twemoji.example.com/🏔️.svg');
    });

    it('renders cover image for gcs cover', () => {
      render(<GroupCard group={imageGroup} />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute(
        'src',
        'https://storage.googleapis.com/bucket/group-covers/group-2/cover.jpg',
      );
    });

    it('renders public visibility badge', () => {
      render(<GroupCard group={emojiGroup} />);
      expect(screen.getByText('visibility.public')).toBeInTheDocument();
    });

    it('renders private visibility badge', () => {
      render(<GroupCard group={imageGroup} />);
      expect(screen.getByText('visibility.private')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('links to the group detail page', () => {
      render(<GroupCard group={emojiGroup} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/groups/group-1');
    });
  });
});
