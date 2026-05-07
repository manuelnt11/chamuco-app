import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileVisibility } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockRefresh: vi.fn(),
  mockOnSuccess: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({ appUser: null, isLoading: false, refresh: mocks.mockRefresh }),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: mocks.mockToastSuccess,
    error: mocks.mockToastError,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ src, fallback }: { src?: string; fallback: string }) => (
    <div data-testid="avatar" data-src={src}>
      {fallback}
    </div>
  ),
}));

vi.mock('@/components/ui/file-upload-button', () => ({
  FileUploadButton: ({
    onSuccess,
    disabled,
  }: {
    uploadType: string;
    contextId: string;
    onSuccess: (key: string) => void;
    disabled?: boolean;
  }) => (
    <button
      data-testid="file-upload-button"
      disabled={disabled}
      onClick={() => onSuccess('avatars/user-uuid/photo.jpg')}
    >
      upload
    </button>
  ),
  UploadType: { USER_AVATAR: 'USER_AVATAR' },
}));

vi.mock('@chamuco/shared-utils', () => ({
  getTwemojiUrl: (emoji: string) => `https://twemoji.example.com/${emoji}.svg`,
}));

vi.mock('@/lib/avatar-emojis', () => ({
  AVATAR_EMOJIS: ['😀', '✈️'],
}));

import type { AppUser } from '@/store/user';
import { AvatarEditor } from './AvatarEditor';

const baseUser: AppUser = {
  id: 'user-uuid',
  username: 'janedoe',
  displayName: 'Jane Doe',
  avatar: null,
  timezone: 'UTC',
  profileVisibility: ProfileVisibility.PRIVATE,
};

function setup(userOverride?: Partial<AppUser>) {
  const user = userEvent.setup();
  render(<AvatarEditor user={{ ...baseUser, ...userOverride }} />);
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockRefresh.mockResolvedValue(undefined);
});

describe('AvatarEditor', () => {
  describe('rendering', () => {
    it('renders avatar with null src and initials fallback when no avatar', () => {
      setup();
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveTextContent('JD');
      expect(avatar).not.toHaveAttribute('data-src');
    });

    it('renders avatar src when user has avatar url', () => {
      setup({
        avatar: {
          id: 'a1',
          type: 'image',
          source: 'gcs',
          target: 'avatars/user-uuid/photo.jpg',
          isPublic: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          url: 'https://storage.googleapis.com/bucket/avatars/user-uuid/photo.jpg',
        },
      });
      expect(screen.getByTestId('avatar')).toHaveAttribute(
        'data-src',
        'https://storage.googleapis.com/bucket/avatars/user-uuid/photo.jpg',
      );
    });

    it('renders the edit button', () => {
      setup();
      expect(screen.getByText('basicInfo.avatarEditor.editButton')).toBeInTheDocument();
    });
  });

  describe('dialog', () => {
    it('opens dialog when edit button is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      expect(screen.getByText('basicInfo.avatarEditor.tabPhoto')).toBeInTheDocument();
      expect(screen.getByText('basicInfo.avatarEditor.tabEmoji')).toBeInTheDocument();
    });

    it('shows photo tab by default', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      expect(screen.getByTestId('file-upload-button')).toBeInTheDocument();
    });

    it('switches to emoji tab', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      await user.click(screen.getByText('basicInfo.avatarEditor.tabEmoji'));
      expect(screen.getByAltText('😀')).toBeInTheDocument();
    });
  });

  describe('photo upload', () => {
    it('calls PATCH with gcs source after successful upload', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      await user.click(screen.getByTestId('file-upload-button'));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/avatar', {
          source: 'gcs',
          target: 'avatars/user-uuid/photo.jpg',
        });
      });
      expect(mocks.mockRefresh).toHaveBeenCalled();
      expect(mocks.mockToastSuccess).toHaveBeenCalledWith('basicInfo.avatarEditor.photoSuccess');
    });

    it('shows error toast when PATCH fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('Network error'));
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      await user.click(screen.getByTestId('file-upload-button'));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('basicInfo.avatarEditor.photoError');
      });
      expect(mocks.mockRefresh).not.toHaveBeenCalled();
    });
  });

  describe('emoji selection', () => {
    it('calls PATCH with emoji source after emoji click', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      await user.click(screen.getByText('basicInfo.avatarEditor.tabEmoji'));
      await user.click(screen.getByAltText('😀'));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/avatar', {
          source: 'emoji',
          target: '😀',
        });
      });
      expect(mocks.mockRefresh).toHaveBeenCalled();
      expect(mocks.mockToastSuccess).toHaveBeenCalledWith('basicInfo.avatarEditor.emojiSuccess');
    });

    it('shows error toast when emoji PATCH fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('Network error'));
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      await user.click(screen.getByText('basicInfo.avatarEditor.tabEmoji'));
      await user.click(screen.getByAltText('😀'));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('basicInfo.avatarEditor.emojiError');
      });
    });
  });
});
