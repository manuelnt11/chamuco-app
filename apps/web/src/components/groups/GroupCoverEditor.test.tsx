import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ResolvedAsset } from '@chamuco/shared-types';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
  mockOnUpdate: vi.fn(),
  mockUpload: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: mocks.mockToastSuccess,
    error: mocks.mockToastError,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key.replace(/^common:/, ''),
  }),
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

import { GroupCoverEditor } from './GroupCoverEditor';

const emojiCover: ResolvedAsset = {
  id: 'asset-1',
  type: 'text',
  source: 'emoji',
  target: '🏔️',
  isPublic: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  url: 'https://twemoji.example.com/🏔️.svg',
};

const imageCover: ResolvedAsset = {
  id: 'asset-2',
  type: 'image',
  source: 'gcs',
  target: 'group-covers/group-uuid/cover.jpg',
  isPublic: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  url: 'https://storage.googleapis.com/bucket/group-covers/group-uuid/cover.jpg',
};

const baseGroup = { id: 'group-uuid', cover: emojiCover };

function setup(groupOverride?: Partial<typeof baseGroup>) {
  const user = userEvent.setup();
  render(
    <GroupCoverEditor group={{ ...baseGroup, ...groupOverride }} onUpdate={mocks.mockOnUpdate} />,
  );
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockUpload.mockResolvedValue('group-covers/group-uuid/cover.jpg');
});

describe('GroupCoverEditor', () => {
  describe('rendering', () => {
    it('renders twemoji img for emoji cover', () => {
      setup();
      const imgs = screen.getAllByRole('img', { hidden: true });
      expect(imgs[0]).toHaveAttribute('src', 'https://twemoji.example.com/🏔️.svg');
    });

    it('renders image for gcs cover', () => {
      setup({ cover: imageCover });
      const imgs = screen.getAllByRole('img', { hidden: true });
      expect(imgs[0]).toHaveAttribute(
        'src',
        'https://storage.googleapis.com/bucket/group-covers/group-uuid/cover.jpg',
      );
    });

    it('renders the edit button', () => {
      setup();
      expect(screen.getByText('cover.editButton')).toBeInTheDocument();
    });
  });

  describe('dialog', () => {
    it('opens dialog when edit button is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));
      expect(screen.getByText('cover.tabImage')).toBeInTheDocument();
      expect(screen.getByText('cover.tabEmoji')).toBeInTheDocument();
    });

    it('shows photo tab by default with file input', async () => {
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));
      expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
    });

    it('switches to emoji tab', async () => {
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));
      await user.click(screen.getByText('cover.tabEmoji'));
      expect(screen.getByAltText('😀')).toBeInTheDocument();
    });

    it('shows current cover inside dialog', async () => {
      const { user } = setup({ cover: imageCover });
      await user.click(screen.getByText('cover.editButton'));
      expect(screen.getByText('cover.currentCover')).toBeInTheDocument();
    });
  });

  describe('photo upload', () => {
    it('shows crop modal after file selection', async () => {
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = new File(['test'], 'cover.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, testFile);

      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
    });

    it('calls PATCH with gcs source after crop confirm', async () => {
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['test'], 'cover.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByTestId('crop-confirm'));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/groups/group-uuid', {
          cover: {
            source: 'gcs',
            target: 'group-covers/group-uuid/cover.jpg',
            fileSize: expect.any(Number),
          },
        });
      });
      expect(mocks.mockOnUpdate).toHaveBeenCalled();
      expect(mocks.mockToastSuccess).toHaveBeenCalledWith('cover.photoSuccess');
    });

    it('hides crop modal after cancel', async () => {
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['test'], 'cover.jpg', { type: 'image/jpeg' }));

      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
      await user.click(screen.getByTestId('crop-cancel'));
      expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
    });

    it('shows error toast when upload fails', async () => {
      mocks.mockUpload.mockRejectedValue(new Error('Upload failed'));
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['test'], 'cover.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByTestId('crop-confirm'));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('cover.photoError');
      });
      expect(mocks.mockOnUpdate).not.toHaveBeenCalled();
    });

    it('shows error toast when PATCH fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('Network error'));
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['test'], 'cover.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByTestId('crop-confirm'));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('cover.photoError');
      });
      expect(mocks.mockOnUpdate).not.toHaveBeenCalled();
    });
  });

  describe('emoji selection', () => {
    it('calls PATCH with emoji source after emoji click', async () => {
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));
      await user.click(screen.getByText('cover.tabEmoji'));
      await user.click(screen.getByAltText('😀'));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/groups/group-uuid', {
          cover: { source: 'emoji', target: '😀' },
        });
      });
      expect(mocks.mockOnUpdate).toHaveBeenCalled();
      expect(mocks.mockToastSuccess).toHaveBeenCalledWith('cover.emojiSuccess');
    });

    it('shows error toast when emoji PATCH fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('Network error'));
      const { user } = setup();
      await user.click(screen.getByText('cover.editButton'));
      await user.click(screen.getByText('cover.tabEmoji'));
      await user.click(screen.getByAltText('😀'));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('cover.emojiError');
      });
    });
  });
});
