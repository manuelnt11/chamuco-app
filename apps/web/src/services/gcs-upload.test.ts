import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { uploadToGcs } from './gcs-upload';

type XhrListener = () => void;
type ProgressListener = (e: ProgressEvent) => void;

function makeXhr(status: number) {
  const listeners: Record<string, XhrListener[]> = {};
  const uploadListeners: Record<string, ProgressListener[]> = {};

  const xhr = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    abort: vi.fn(),
    status,
    upload: {
      addEventListener: vi.fn((event: string, handler: ProgressListener) => {
        uploadListeners[event] = uploadListeners[event] ?? [];
        uploadListeners[event].push(handler);
      }),
    },
    addEventListener: vi.fn((event: string, handler: XhrListener) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(handler);
    }),
    fire: (event: string) => listeners[event]?.forEach((h) => h()),
    fireUpload: (event: string, eventData: ProgressEvent) =>
      uploadListeners[event]?.forEach((h) => h(eventData)),
  };

  (global as { XMLHttpRequest: unknown }).XMLHttpRequest = function () {
    return xhr;
  };

  return xhr;
}

describe('uploadToGcs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves on 2xx response', async () => {
    const xhr = makeXhr(200);
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://storage.example.com/upload', file, vi.fn());
    xhr.fire('load');

    await expect(promise).resolves.toBeUndefined();
  });

  it('resolves on 201 response', async () => {
    const xhr = makeXhr(201);
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://storage.example.com/upload', file, vi.fn());
    xhr.fire('load');

    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects with status message on non-2xx response', async () => {
    const xhr = makeXhr(403);
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://storage.example.com/upload', file, vi.fn());
    xhr.fire('load');

    await expect(promise).rejects.toThrow('GCS upload failed with status 403');
  });

  it('rejects on network error', async () => {
    const xhr = makeXhr(0);
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://storage.example.com/upload', file, vi.fn());
    xhr.fire('error');

    await expect(promise).rejects.toThrow('Network error during upload');
  });

  it('rejects on abort', async () => {
    const xhr = makeXhr(0);
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://storage.example.com/upload', file, vi.fn());
    xhr.fire('abort');

    await expect(promise).rejects.toThrow('Upload aborted');
  });

  it('calls onProgress with percentage during upload', async () => {
    const xhr = makeXhr(200);
    const onProgress = vi.fn();
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://storage.example.com/upload', file, onProgress);
    xhr.fireUpload('progress', { lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent);
    xhr.fire('load');

    await promise;
    expect(onProgress).toHaveBeenCalledWith(50); // Math.round(50/100 * 99) = Math.round(49.5) = 50
  });

  it('ignores progress events when lengthComputable is false', async () => {
    const xhr = makeXhr(200);
    const onProgress = vi.fn();
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://storage.example.com/upload', file, onProgress);
    xhr.fireUpload('progress', {
      lengthComputable: false,
      loaded: 50,
      total: 100,
    } as ProgressEvent);
    xhr.fire('load');

    await promise;
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('opens a PUT request to the upload URL', async () => {
    const xhr = makeXhr(200);
    const file = new File(['data'], 'img.png', { type: 'image/png' });

    const promise = uploadToGcs('https://bucket.com/key?sig=abc', file, vi.fn());
    xhr.fire('load');

    await promise;
    expect(xhr.open).toHaveBeenCalledWith('PUT', 'https://bucket.com/key?sig=abc');
  });

  it('sets Content-Type header matching the file type', async () => {
    const xhr = makeXhr(200);
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

    const promise = uploadToGcs('https://bucket.com/key', file, vi.fn());
    xhr.fire('load');

    await promise;
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
  });

  it('sends the file as the request body', async () => {
    const xhr = makeXhr(200);
    const file = new File(['content'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://bucket.com/key', file, vi.fn());
    xhr.fire('load');

    await promise;
    expect(xhr.send).toHaveBeenCalledWith(file);
  });

  it('aborts and rejects after 5 minutes with no response', async () => {
    const xhr = makeXhr(0);
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://bucket.com/key', file, vi.fn());

    vi.advanceTimersByTime(5 * 60 * 1000);
    xhr.fire('abort');

    await expect(promise).rejects.toThrow('Upload aborted');
  });

  it('does not reject before timeout elapses', async () => {
    const xhr = makeXhr(200);
    const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' });

    const promise = uploadToGcs('https://bucket.com/key', file, vi.fn());
    vi.advanceTimersByTime(4 * 60 * 1000);
    xhr.fire('load');

    await expect(promise).resolves.toBeUndefined();
  });
});
