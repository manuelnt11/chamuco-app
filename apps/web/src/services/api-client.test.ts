import { setTokenProvider, apiClient } from './api-client';

// vi.hoisted ensures these exist before the vi.mock factory runs
const { mockAxiosInstance, mockRequestUse, mockResponseUse } = vi.hoisted(() => {
  const reqUse = vi.fn();
  const resUse = vi.fn();
  // The instance is also called by the response interceptor during retry
  const instance = Object.assign(vi.fn().mockResolvedValue({ status: 200 }), {
    interceptors: {
      request: { use: reqUse },
      response: { use: resUse },
    },
  });
  return { mockAxiosInstance: instance, mockRequestUse: reqUse, mockResponseUse: resUse };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

// Interceptor handlers registered at module load time — extract once
let requestFulfilled: (config: Record<string, unknown>) => Promise<Record<string, unknown>>;
let responseFulfilled: (res: unknown) => unknown;
let responseRejected: (err: unknown) => Promise<unknown>;

beforeAll(() => {
  requestFulfilled = mockRequestUse.mock.calls[0][0] as typeof requestFulfilled;
  [responseFulfilled, responseRejected] = mockResponseUse.mock.calls[0] as [
    typeof responseFulfilled,
    typeof responseRejected,
  ];
});

beforeEach(() => {
  // Reset tokenProvider to null between tests
  setTokenProvider(null as unknown as Parameters<typeof setTokenProvider>[0]);
  mockAxiosInstance.mockClear();
});

describe('setTokenProvider', () => {
  it('registers the token function so the request interceptor can call it', async () => {
    const mockProvider = vi.fn().mockResolvedValue('abc');
    setTokenProvider(mockProvider);

    const config = { headers: { set: vi.fn() } };
    await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(mockProvider).toHaveBeenCalled();
  });
});

describe('request interceptor', () => {
  it('attaches Authorization header when the token provider returns a token', async () => {
    setTokenProvider(vi.fn().mockResolvedValue('token-abc'));
    const mockSet = vi.fn();
    const config = { headers: { set: mockSet } };

    const result = await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(mockSet).toHaveBeenCalledWith('Authorization', 'Bearer token-abc');
    expect(result).toBe(config);
  });

  it('does not attach Authorization header when the token is null', async () => {
    setTokenProvider(vi.fn().mockResolvedValue(null));
    const mockSet = vi.fn();
    const config = { headers: { set: mockSet } };

    await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('does not attach Authorization header when no provider is registered', async () => {
    const mockSet = vi.fn();
    const config = { headers: { set: mockSet } };

    await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(mockSet).not.toHaveBeenCalled();
  });

  it('returns the config object unchanged', async () => {
    const config = { headers: { set: vi.fn() } };

    const result = await requestFulfilled(config as unknown as Record<string, unknown>);

    expect(result).toBe(config);
  });
});

describe('response interceptor', () => {
  it('passes through successful responses unchanged', () => {
    const response = { status: 200, data: {} };

    expect(responseFulfilled(response)).toBe(response);
  });

  it('retries once with a force-refreshed token on 401', async () => {
    const freshToken = 'fresh-999';
    setTokenProvider(vi.fn().mockResolvedValue(freshToken));

    const mockSet = vi.fn();
    const originalRequest = { headers: { set: mockSet }, _retry: undefined };
    const error = { response: { status: 401 }, config: originalRequest };

    await responseRejected(error);

    expect(originalRequest._retry).toBe(true);
    expect(mockSet).toHaveBeenCalledWith('Authorization', `Bearer ${freshToken}`);
    expect(mockAxiosInstance).toHaveBeenCalledWith(originalRequest);
  });

  it('skips the Authorization update when force-refresh returns null', async () => {
    setTokenProvider(vi.fn().mockResolvedValue(null));

    const mockSet = vi.fn();
    const originalRequest = { headers: { set: mockSet }, _retry: undefined };
    const error = { response: { status: 401 }, config: originalRequest };

    await responseRejected(error);

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockAxiosInstance).toHaveBeenCalledWith(originalRequest);
  });

  it('does not retry a second time when _retry is already true', async () => {
    setTokenProvider(vi.fn().mockResolvedValue('some-token'));
    const error = {
      response: { status: 401 },
      config: { headers: { set: vi.fn() }, _retry: true },
    };

    await expect(responseRejected(error)).rejects.toEqual(error);
    expect(mockAxiosInstance).not.toHaveBeenCalled();
  });

  it('rejects non-401 errors without retrying', async () => {
    const error = { response: { status: 500 }, config: { headers: { set: vi.fn() } } };

    await expect(responseRejected(error)).rejects.toEqual(error);
    expect(mockAxiosInstance).not.toHaveBeenCalled();
  });

  it('rejects errors with no config without retrying', async () => {
    const error = { response: { status: 401 }, config: undefined };

    await expect(responseRejected(error)).rejects.toEqual(error);
    expect(mockAxiosInstance).not.toHaveBeenCalled();
  });
});

describe('apiClient export', () => {
  it('is the axios instance created by axios.create', () => {
    expect(apiClient).toBe(mockAxiosInstance);
  });
});
