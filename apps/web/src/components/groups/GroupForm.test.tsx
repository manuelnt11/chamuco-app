import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupVisibility, UploadType } from '@chamuco/shared-types';
import type { Group } from '@/types/group';

const mocks = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockToastError: vi.fn(),
  mockOnSuccess: vi.fn(),
  mockUploadToGcs: vi.fn(),
  mockIsAxiosError: vi.fn(),
}));

vi.mock('axios', () => ({
  default: { isAxiosError: mocks.mockIsAxiosError },
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    post: mocks.mockPost,
    patch: mocks.mockPatch,
  },
}));

vi.mock('@/services/gcs-upload', () => ({
  uploadToGcs: mocks.mockUploadToGcs,
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.mockToastError },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key.replace(/^(?:groups|common):/, ''),
  }),
}));

vi.mock('@chamuco/shared-utils', () => ({
  getTwemojiUrl: (emoji: string) => `https://twemoji.example.com/${emoji}.svg`,
}));

vi.mock('@/lib/avatar-emojis', () => ({
  AVATAR_EMOJIS: ['😀', '✈️', '🏔️'],
}));

vi.mock('./GroupCoverCropModal', () => ({
  GroupCoverCropModal: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (blob: Blob) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="crop-modal">
      <button
        type="button"
        onClick={() => onConfirm(new Blob(['test-image'], { type: 'image/jpeg' }))}
      >
        confirm-crop
      </button>
      <button type="button" onClick={onCancel}>
        cancel-crop
      </button>
    </div>
  ),
}));

import { GroupForm } from './GroupForm';

const mockGroup: Group = {
  id: 'group-uuid',
  name: 'Mountain Crew',
  description: 'Hikers group',
  cover: {
    id: 'asset-1',
    type: 'text',
    source: 'emoji',
    target: '😀',
    isPublic: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    url: 'https://twemoji.example.com/😀.svg',
  },
  visibility: GroupVisibility.PUBLIC,
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockSignedUrlResponse = {
  uploadUrl: 'https://storage.googleapis.com/signed-upload',
  objectKey: 'group-covers/group-uuid/cover.jpg',
  expiresAt: '2026-01-02T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPost.mockResolvedValue({ data: mockGroup });
  mocks.mockPatch.mockResolvedValue({ data: mockGroup });
  mocks.mockUploadToGcs.mockResolvedValue(undefined);
  mocks.mockIsAxiosError.mockReturnValue(false);
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
  global.URL.revokeObjectURL = vi.fn();
});

function setupCreate() {
  const user = userEvent.setup();
  render(<GroupForm mode="create" onSuccess={mocks.mockOnSuccess} />);
  return { user };
}

function setupEdit() {
  const user = userEvent.setup();
  render(
    <GroupForm
      mode="edit"
      groupId="group-uuid"
      initialValues={{
        name: 'Mountain Crew',
        description: 'Hikers group',
        visibility: GroupVisibility.PUBLIC,
      }}
      onSuccess={mocks.mockOnSuccess}
    />,
  );
  return { user };
}

describe('GroupForm', () => {
  describe('create mode rendering', () => {
    it('renders name, description, visibility, and cover section with tabs', () => {
      setupCreate();
      expect(screen.getByLabelText('name')).toBeInTheDocument();
      expect(screen.getByLabelText('description')).toBeInTheDocument();
      expect(screen.getByText('visibility.label')).toBeInTheDocument();
      expect(screen.getByText('cover.label')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'cover.tabImage' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'cover.tabEmoji' })).toBeInTheDocument();
    });

    it('renders visibility radio buttons', () => {
      setupCreate();
      expect(screen.getByDisplayValue(GroupVisibility.PUBLIC)).toBeInTheDocument();
      expect(screen.getByDisplayValue(GroupVisibility.PRIVATE)).toBeInTheDocument();
    });

    it('shows emoji picker by default', () => {
      setupCreate();
      expect(screen.getByAltText('😀')).toBeInTheDocument();
    });

    it('shows create submit button', () => {
      setupCreate();
      expect(screen.getByRole('button', { name: 'form.submit' })).toBeInTheDocument();
    });

    it('submit button disabled when name is empty', () => {
      setupCreate();
      expect(screen.getByRole('button', { name: 'form.submit' })).toBeDisabled();
    });
  });

  describe('photo tab', () => {
    it('shows choose file button when photo tab is active', async () => {
      const { user } = setupCreate();
      await user.click(screen.getByRole('button', { name: 'cover.tabImage' }));
      expect(screen.getByRole('button', { name: 'upload.chooseFile' })).toBeInTheDocument();
    });

    it('submit is disabled when photo tab is active with no photo', async () => {
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('name'), 'Test Group');
      await user.click(screen.getByRole('button', { name: 'cover.tabImage' }));
      expect(screen.getByRole('button', { name: 'form.submit' })).toBeDisabled();
    });

    it('shows crop modal after file is selected', async () => {
      const { user } = setupCreate();
      await user.click(screen.getByRole('button', { name: 'cover.tabImage' }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
      expect(screen.getByTestId('crop-modal')).toBeInTheDocument();
    });

    it('shows edit button after crop confirm and enables submit', async () => {
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('name'), 'Test Group');
      await user.click(screen.getByRole('button', { name: 'cover.tabImage' }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByRole('button', { name: 'confirm-crop' }));
      expect(screen.getByRole('button', { name: 'cover.editButton' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'form.submit' })).not.toBeDisabled();
    });

    it('dismisses crop modal on cancel', async () => {
      const { user } = setupCreate();
      await user.click(screen.getByRole('button', { name: 'cover.tabImage' }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByRole('button', { name: 'cancel-crop' }));
      expect(screen.queryByTestId('crop-modal')).not.toBeInTheDocument();
    });
  });

  describe('edit mode rendering', () => {
    it('does not render cover section in edit mode', () => {
      setupEdit();
      expect(screen.queryByText('cover.label')).not.toBeInTheDocument();
    });

    it('pre-fills initial values', () => {
      setupEdit();
      expect(screen.getByDisplayValue('Mountain Crew')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Hikers group')).toBeInTheDocument();
    });

    it('shows save changes submit button', () => {
      setupEdit();
      expect(screen.getByRole('button', { name: 'form.saveChanges' })).toBeInTheDocument();
    });
  });

  describe('create form submission', () => {
    it('calls POST /v1/groups with correct payload (emoji cover)', async () => {
      const { user } = setupCreate();

      await user.type(screen.getByLabelText('name'), 'Hiking Squad');
      await user.click(screen.getByAltText('✈️'));
      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockPost).toHaveBeenCalledWith('/v1/groups', {
          name: 'Hiking Squad',
          description: undefined,
          visibility: GroupVisibility.PUBLIC,
          cover: { source: 'emoji', target: '✈️' },
        });
      });
      expect(mocks.mockOnSuccess).toHaveBeenCalledWith(mockGroup);
    });

    it('omits empty description', async () => {
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('name'), 'New Group');
      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockPost).toHaveBeenCalledWith(
          '/v1/groups',
          expect.objectContaining({
            description: undefined,
          }),
        );
      });
    });

    it('photo submission: POST group → signed-url → uploadToGcs → PATCH → onSuccess', async () => {
      mocks.mockPost
        .mockResolvedValueOnce({ data: mockGroup })
        .mockResolvedValueOnce({ data: mockSignedUrlResponse });

      const { user } = setupCreate();
      await user.type(screen.getByLabelText('name'), 'Hiking Squad');
      await user.click(screen.getByRole('button', { name: 'cover.tabImage' }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, new File(['img'], 'photo.jpg', { type: 'image/jpeg' }));
      await user.click(screen.getByRole('button', { name: 'confirm-crop' }));
      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockPost).toHaveBeenNthCalledWith(1, '/v1/groups', {
          name: 'Hiking Squad',
          description: undefined,
          visibility: GroupVisibility.PUBLIC,
          cover: { source: 'emoji', target: '😀' },
        });
        expect(mocks.mockPost).toHaveBeenNthCalledWith(2, '/v1/uploads/signed-url', {
          uploadType: UploadType.GROUP_COVER,
          contextId: 'group-uuid',
          contentType: 'image/jpeg',
          fileSize: expect.any(Number),
        });
        expect(mocks.mockUploadToGcs).toHaveBeenCalledWith(
          'https://storage.googleapis.com/signed-upload',
          expect.any(File),
          expect.any(Function),
        );
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/groups/group-uuid', {
          cover: {
            source: 'gcs',
            target: 'group-covers/group-uuid/cover.jpg',
            fileSize: expect.any(Number),
          },
        });
        expect(mocks.mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows createFailed toast on generic POST error', async () => {
      mocks.mockPost.mockRejectedValue(new Error('Server error'));
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('name'), 'Hiking Squad');
      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('errors.createFailed');
      });
      expect(mocks.mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows forbidden toast on 403 POST error', async () => {
      const err = { response: { status: 403 } };
      mocks.mockPost.mockRejectedValue(err);
      mocks.mockIsAxiosError.mockReturnValue(true);
      const { user } = setupCreate();
      await user.type(screen.getByLabelText('name'), 'Hiking Squad');
      await user.click(screen.getByRole('button', { name: 'form.submit' }));

      await waitFor(() => {
        expect(mocks.mockToastError).toHaveBeenCalledWith('errors.forbidden');
      });
    });
  });

  describe('edit form submission', () => {
    it('calls PATCH /v1/groups/:id with updated payload', async () => {
      const { user } = setupEdit();

      const nameInput = screen.getByDisplayValue('Mountain Crew');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(screen.getByRole('button', { name: 'form.saveChanges' }));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/groups/group-uuid', {
          name: 'Updated Name',
          description: 'Hikers group',
          visibility: GroupVisibility.PUBLIC,
        });
      });
      expect(mocks.mockOnSuccess).toHaveBeenCalledWith(mockGroup);
    });

    it('changes visibility via radio', async () => {
      const { user } = setupEdit();
      await user.click(screen.getByDisplayValue(GroupVisibility.PRIVATE));
      await user.click(screen.getByRole('button', { name: 'form.saveChanges' }));

      await waitFor(() => {
        expect(mocks.mockPatch).toHaveBeenCalledWith(
          '/v1/groups/group-uuid',
          expect.objectContaining({
            visibility: GroupVisibility.PRIVATE,
          }),
        );
      });
    });
  });
});
