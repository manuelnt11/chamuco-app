import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UploadType } from '@chamuco/shared-types';
import { FileUploadButton } from './file-upload-button';
import * as useFileUploadModule from '@/hooks/useFileUpload';

vi.mock('@/hooks/useFileUpload');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'upload.progressLabel') return `Upload progress: ${String(opts?.progress)}%`;
      const map: Record<string, string> = {
        'upload.chooseFile': 'Choose file',
        'upload.uploading': 'Uploading...',
        'upload.retry': 'Retry',
        'upload.errorDefault': 'Upload failed. Please try again.',
      };
      return map[key] ?? key;
    },
  }),
}));

const mockUpload = vi.fn();
const mockReset = vi.fn();

function mockHookState(overrides: Partial<ReturnType<typeof useFileUploadModule.useFileUpload>>) {
  vi.spyOn(useFileUploadModule, 'useFileUpload').mockReturnValue({
    upload: mockUpload,
    reset: mockReset,
    progress: 0,
    isUploading: false,
    error: null,
    ...overrides,
  });
}

const defaultProps = {
  uploadType: UploadType.USER_AVATAR,
  contextId: 'user-1',
  onSuccess: vi.fn(),
};

describe('FileUploadButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookState({});
  });

  it('renders the trigger button with default label', () => {
    render(<FileUploadButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument();
  });

  it('renders custom children as button label', () => {
    render(<FileUploadButton {...defaultProps}>Upload avatar</FileUploadButton>);
    expect(screen.getByRole('button', { name: 'Upload avatar' })).toBeInTheDocument();
  });

  it('shows uploading label when isUploading', () => {
    mockHookState({ isUploading: true, progress: 30 });

    render(<FileUploadButton {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveTextContent('Uploading...');
  });

  it('shows progress bar when uploading', () => {
    mockHookState({ isUploading: true, progress: 60 });

    render(<FileUploadButton {...defaultProps} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-label', 'Upload progress: 60%');
  });

  it('hides progress bar when not uploading', () => {
    mockHookState({ isUploading: false });

    render(<FileUploadButton {...defaultProps} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows localized error message with retry button when error occurs', () => {
    mockHookState({ error: 'GCS upload failed with status 403', isUploading: false });

    render(<FileUploadButton {...defaultProps} />);
    expect(screen.getByText(/Upload failed\. Please try again\./)).toBeInTheDocument();
    expect(screen.queryByText(/GCS upload failed/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('hides error message while uploading', () => {
    mockHookState({ error: 'some error', isUploading: true, progress: 50 });

    render(<FileUploadButton {...defaultProps} />);
    expect(screen.queryByText('Upload failed. Please try again.')).not.toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<FileUploadButton {...defaultProps} disabled />);
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeDisabled();
  });

  it('disables button while uploading', () => {
    mockHookState({ isUploading: true, progress: 20 });

    render(<FileUploadButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Uploading...' })).toBeDisabled();
  });

  it('calls onSuccess with objectKey after successful upload', async () => {
    const onSuccess = vi.fn();
    mockUpload.mockResolvedValueOnce('avatars/user-1/uuid.jpg');
    mockHookState({ upload: mockUpload });

    render(<FileUploadButton {...defaultProps} onSuccess={onSuccess} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('avatars/user-1/uuid.jpg');
    });
  });

  it('calls onError when upload fails', async () => {
    const onError = vi.fn();
    const error = new Error('Upload failed');
    mockUpload.mockRejectedValueOnce(error);
    mockHookState({ upload: mockUpload });

    render(<FileUploadButton {...defaultProps} onError={onError} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  it('calls reset before each upload attempt', async () => {
    mockUpload.mockResolvedValueOnce('key');
    mockHookState({ upload: mockUpload, reset: mockReset });

    render(<FileUploadButton {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose file' }));
    expect(mockReset).toHaveBeenCalled();
  });
});
