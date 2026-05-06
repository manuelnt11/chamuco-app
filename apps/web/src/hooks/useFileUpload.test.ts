import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useFileUpload } from './useFileUpload';
import { apiClient } from '@/services/api-client';
import * as gcsUpload from '@/services/gcs-upload';

vi.mock('@/services/api-client', () => ({
  apiClient: { post: vi.fn() },
}));

vi.mock('@/services/gcs-upload', () => ({
  uploadToGcs: vi.fn(),
}));

const mockApiPost = apiClient.post as ReturnType<typeof vi.fn>;
const mockUploadToGcs = gcsUpload.uploadToGcs as ReturnType<typeof vi.fn>;

const signedUrlResponse = {
  data: {
    uploadUrl: 'https://storage.googleapis.com/chamuco-uploads/avatars/user-1/uuid.jpg?sig=abc',
    objectKey: 'avatars/user-1/uuid.jpg',
    expiresAt: '2026-05-05T14:00:00.000Z',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUploadToGcs.mockResolvedValue(undefined);
});

describe('useFileUpload', () => {
  const defaultOptions = { uploadType: 'USER_AVATAR' as const, contextId: 'user-1' };

  it('starts with idle state', () => {
    const { result } = renderHook(() => useFileUpload(defaultOptions));

    expect(result.current.isUploading).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('returns objectKey on successful upload', async () => {
    mockApiPost.mockResolvedValueOnce(signedUrlResponse);

    const { result } = renderHook(() => useFileUpload(defaultOptions));
    const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });

    let objectKey: string | undefined;
    await act(async () => {
      objectKey = await result.current.upload(file);
    });

    expect(objectKey).toBe('avatars/user-1/uuid.jpg');
    expect(result.current.progress).toBe(100);
    expect(result.current.isUploading).toBe(false);
  });

  it('calls the API with correct payload', async () => {
    mockApiPost.mockResolvedValueOnce(signedUrlResponse);

    const { result } = renderHook(() => useFileUpload(defaultOptions));
    const file = new File(['x'.repeat(1024)], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.upload(file);
    });

    expect(mockApiPost).toHaveBeenCalledWith('/v1/uploads/signed-url', {
      uploadType: 'USER_AVATAR',
      contextId: 'user-1',
      contentType: 'image/jpeg',
      fileSize: file.size,
    });
  });

  it('calls uploadToGcs with the signed URL and file', async () => {
    mockApiPost.mockResolvedValueOnce(signedUrlResponse);

    const { result } = renderHook(() => useFileUpload(defaultOptions));
    const file = new File(['data'], 'img.png', { type: 'image/png' });

    await act(async () => {
      await result.current.upload(file);
    });

    expect(mockUploadToGcs).toHaveBeenCalledWith(
      signedUrlResponse.data.uploadUrl,
      file,
      expect.any(Function),
    );
  });

  it('sets isUploading true during GCS upload and false after', async () => {
    let resolvePut!: () => void;
    mockApiPost.mockResolvedValueOnce(signedUrlResponse);
    mockUploadToGcs.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePut = resolve;
      }),
    );

    const { result } = renderHook(() => useFileUpload(defaultOptions));
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    // Start upload in background
    let uploadPromise!: Promise<string>;
    act(() => {
      uploadPromise = result.current.upload(file);
    });

    // Allow API call + uploadToGcs call to start
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      resolvePut();
      await uploadPromise;
    });
    expect(result.current.isUploading).toBe(false);
  });

  it('sets error and throws when API call fails', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFileUpload(defaultOptions));
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow('Network error');
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isUploading).toBe(false);
  });

  it('sets error and throws when GCS upload fails', async () => {
    mockApiPost.mockResolvedValueOnce(signedUrlResponse);
    mockUploadToGcs.mockRejectedValueOnce(new Error('GCS upload failed with status 403'));

    const { result } = renderHook(() => useFileUpload(defaultOptions));
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow(
        'GCS upload failed with status 403',
      );
    });

    expect(result.current.error).toBe('GCS upload failed with status 403');
  });

  it('sets progress to 100 after successful upload', async () => {
    mockApiPost.mockResolvedValueOnce(signedUrlResponse);

    const { result } = renderHook(() => useFileUpload(defaultOptions));
    await act(async () => {
      await result.current.upload(new File(['x'], 'f.jpg', { type: 'image/jpeg' }));
    });

    expect(result.current.progress).toBe(100);
  });

  it('reset clears error, progress, and uploading state', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useFileUpload(defaultOptions));

    await act(async () => {
      await result.current
        .upload(new File(['x'], 'f.jpg', { type: 'image/jpeg' }))
        .catch(() => undefined);
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.isUploading).toBe(false);
  });
});
