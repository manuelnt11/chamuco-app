import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileVisibility } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockRefresh: vi.fn(),
  mockUpload: vi.fn(),
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
  useTranslation: () => ({ t: (key: string) => key.replace(/^common:/, '') }),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ src, fallback }: { src?: string; fallback: string }) => (
    <div data-testid="avatar" data-src={src}>
      {fallback}
    </div>
  ),
}));

vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    upload: mocks.mockUpload,
    progress: 0,
    isUploading: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock('@/components/ui/crop-modal', () => ({
  CropModal: ({
    onConfirm,
    onCancel,
  }: {
    file: File;
    onConfirm: (blob: Blob) => void;
    onCancel: () => void;
    isConfirming: boolean;
    uploadProgress: number;
    isUploading: boolean;
    title: string;
    confirmLabel: string;
    circular?: boolean;
    outputWidth?: number;
  }) => (
    <div data-testid="crop-modal">
      <button
        data-testid="crop-confirm"
        onClick={() => onConfirm(new Blob(['jpeg'], { type: 'image/jpeg' }))}
      >
        confirm
      </button>
      <button data-testid="crop-cancel" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
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
  mocks.mockUpload.mockResolvedValue('avatars/user-uuid/photo.jpg');
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

    it('shows photo tab by default with file input', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    it('switches to emoji tab', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));
      await user.click(screen.getByText('basicInfo.avatarEditor.tabEmoji'));
      expect(screen.getByAltText('😀')).toBeInTheDocument();
    });
  });

  describe('photo upload', () => {
    it('shows crop modal after file selection', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, testFile);

      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
    });

    it('shows current avatar inside dialog when it opens', async () => {
      const { user } = setup({
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
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));

      // Two avatars rendered: one outside the dialog, one inside
      const avatars = screen.getAllByTestId('avatar');
      expect(avatars).toHaveLength(2);
      expect(avatars[1]).toHaveAttribute(
        'data-src',
        'https://storage.googleapis.com/bucket/avatars/user-uuid/photo.jpg',
      );
    });

    it('does not show current avatar section when user has no avatar', async () => {
      const { user } = setup({ avatar: null });
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));

      // Only one avatar rendered: the one outside the dialog
      const avatars = screen.getAllByTestId('avatar');
      expect(avatars).toHaveLength(1);
    });

    it('calls PATCH with gcs source after crop confirm', async () => {
      mocks.mockUpload.mockResolvedValue('avatars/user-uuid/photo.jpg');
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['test'], 'photo.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByTestId('crop-confirm'));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/avatar', {
          source: 'gcs',
          target: 'avatars/user-uuid/photo.jpg',
          fileSize: expect.any(Number),
        });
      });
      expect(mocks.mockRefresh).toHaveBeenCalled();
      expect(mocks.mockToastSuccess).toHaveBeenCalledWith('basicInfo.avatarEditor.photoSuccess');
    });

    it('hides crop modal after cancel', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['test'], 'photo.jpg', { type: 'image/jpeg' }));

      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
      await user.click(screen.getByTestId('crop-cancel'));
      expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
    });

    it('shows error toast when upload fails', async () => {
      mocks.mockUpload.mockRejectedValue(new Error('Upload failed'));
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['test'], 'photo.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByTestId('crop-confirm'));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('basicInfo.avatarEditor.photoError');
      });
      expect(mocks.mockRefresh).not.toHaveBeenCalled();
    });

    it('shows error toast when PATCH fails', async () => {
      mocks.mockUpload.mockResolvedValue('avatars/user-uuid/photo.jpg');
      mocks.mockPatch.mockRejectedValue(new Error('Network error'));
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['test'], 'photo.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByTestId('crop-confirm'));

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
