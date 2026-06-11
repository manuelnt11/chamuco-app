import { submitFeedback } from './feedback.service';
import type { FeedbackPayload, FeedbackResponseDto } from '@/services/feedback.types';

const { mockGet, mockPost, mockPatch, mockDelete } = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();
  const del = vi.fn();
  return { mockGet: get, mockPost: post, mockPatch: patch, mockDelete: del };
});

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

beforeEach(() => {
  mockGet.mockClear();
  mockPost.mockClear();
  mockPatch.mockClear();
  mockDelete.mockClear();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const feedbackPayload: FeedbackPayload = {
  comment: 'Great app!',
  currentPage: '/dashboard',
  userAgent: 'Mozilla/5.0',
  viewportSize: '1920x1080',
  language: 'en',
  theme: 'LIGHT',
};

const feedbackResponseFixture: FeedbackResponseDto = {
  issueUrl: 'https://github.com/org/repo/issues/42',
};

// ─── Feedback methods ─────────────────────────────────────────────────────────

describe('submitFeedback', () => {
  it('posts to /v1/feedback and returns the response', async () => {
    mockPost.mockResolvedValueOnce({ data: feedbackResponseFixture });
    const result = await submitFeedback(feedbackPayload);
    expect(mockPost).toHaveBeenCalledWith('/v1/feedback', feedbackPayload);
    expect(result).toEqual(feedbackResponseFixture);
  });

  it('propagates 401 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(submitFeedback(feedbackPayload)).rejects.toEqual({ response: { status: 401 } });
  });

  it('propagates 422 errors', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 422 } });
    await expect(submitFeedback(feedbackPayload)).rejects.toEqual({ response: { status: 422 } });
  });
});
