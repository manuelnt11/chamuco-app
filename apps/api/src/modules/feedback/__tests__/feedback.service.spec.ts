import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from '@/modules/feedback/feedback.service';

const MOCK_ISSUE_URL = 'https://github.com/manuelnt11/Chamuco-App/issues/42';
const MOCK_ISSUE_NODE_ID = 'I_mock_node_id_123';
const MOCK_PROJECT_NODE_ID = 'PVT_mock_project_id';

function makeIssueMock() {
  return {
    ok: true,
    json: jest
      .fn()
      .mockResolvedValue({ html_url: MOCK_ISSUE_URL, number: 42, node_id: MOCK_ISSUE_NODE_ID }),
  };
}

function makeProjectFetchMock() {
  return {
    ok: true,
    json: jest
      .fn()
      .mockResolvedValue({ data: { user: { projectV2: { id: MOCK_PROJECT_NODE_ID } } } }),
  };
}

function makeProjectMutationMock() {
  return {
    ok: true,
    json: jest
      .fn()
      .mockResolvedValue({ data: { addProjectV2ItemById: { item: { id: 'PVTI_new' } } } }),
  };
}

describe('FeedbackService', () => {
  let service: FeedbackService;
  let mockFetch: jest.Mock;

  beforeEach(async () => {
    mockFetch = jest.fn().mockResolvedValue(makeIssueMock());
    global.fetch = mockFetch;

    process.env.GITHUB_TOKEN = 'ghp_test_token';
    process.env.GITHUB_REPO_OWNER = 'manuelnt11';
    process.env.GITHUB_REPO_NAME = 'Chamuco-App';
    delete process.env.GITHUB_PROJECT_NUMBER;

    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedbackService],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sanitize', () => {
    it('strips HTML tags leaving text content', () => {
      expect(service.sanitize('<b>bold</b> text')).toBe('bold text');
    });

    it('strips script tags leaving inner text', () => {
      expect(service.sanitize('<script>alert("x")</script>Hello')).toBe('alert("x")Hello');
    });

    it('normalizes multiple whitespace to single space', () => {
      expect(service.sanitize('hello   world\n\tthere')).toBe('hello world there');
    });

    it('trims leading and trailing whitespace', () => {
      expect(service.sanitize('  hello  ')).toBe('hello');
    });

    it('strips HTML and normalizes whitespace together', () => {
      expect(service.sanitize('  <b>bold</b>  text  ')).toBe('bold text');
    });
  });

  describe('createFeedback', () => {
    it('returns issue URL on success', async () => {
      const result = await service.createFeedback('user-uuid', 'This is my feedback comment.');

      expect(result).toEqual({ issueUrl: MOCK_ISSUE_URL });
    });

    it('calls GitHub API with correct headers and method', async () => {
      await service.createFeedback('user-uuid', 'This is my feedback comment.');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/manuelnt11/Chamuco-App/issues',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer ghp_test_token',
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          }),
        }),
      );
    });

    it('includes user-feedback label in the request body', async () => {
      await service.createFeedback('user-uuid', 'This is my feedback comment.');

      const callArg = mockFetch.mock.calls[0][1] as { body: string };
      const body = JSON.parse(callArg.body) as { labels: string[] };
      expect(body.labels).toContain('user-feedback');
    });

    it('anonymizes userId — does not include raw userId in issue body', async () => {
      const userId = 'sensitive-user-uuid';
      await service.createFeedback(userId, 'This is my feedback comment.');

      const callArg = mockFetch.mock.calls[0][1] as { body: string };
      const body = JSON.parse(callArg.body) as { body: string };
      expect(body.body).not.toContain(userId);
    });

    it('sanitizes comment before sending to GitHub', async () => {
      await service.createFeedback('user-uuid', '<b>Bold</b> feedback comment here.');

      const callArg = mockFetch.mock.calls[0][1] as { body: string };
      const body = JSON.parse(callArg.body) as { body: string };
      expect(body.body).not.toContain('<b>');
      expect(body.body).toContain('Bold feedback comment here.');
    });

    it('throws ServiceUnavailableException when GitHub API returns non-ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: jest.fn().mockResolvedValue('Unprocessable Entity'),
      });

      await expect(
        service.createFeedback('user-uuid', 'My feedback comment here.'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws ServiceUnavailableException when fetch throws a network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(
        service.createFeedback('user-uuid', 'My feedback comment here.'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('includes context table in issue body when context is provided', async () => {
      await service.createFeedback('user-uuid', 'My feedback comment here.', {
        currentPage: '/trips/123',
        userAgent: 'Mozilla/5.0',
        viewportSize: '1920x1080',
        language: 'es-CO',
      });

      const callArg = mockFetch.mock.calls[0][1] as { body: string };
      const body = JSON.parse(callArg.body) as { body: string };
      expect(body.body).toContain('## Context');
      expect(body.body).toContain('/trips/123');
      expect(body.body).toContain('Mozilla/5.0');
      expect(body.body).toContain('1920x1080');
      expect(body.body).toContain('es-CO');
    });

    it('omits context section when no context provided', async () => {
      await service.createFeedback('user-uuid', 'My feedback comment here.');

      const callArg = mockFetch.mock.calls[0][1] as { body: string };
      const body = JSON.parse(callArg.body) as { body: string };
      expect(body.body).not.toContain('## Context');
    });
  });

  describe('project linking', () => {
    beforeEach(() => {
      process.env.GITHUB_PROJECT_NUMBER = '4';
    });

    it('adds issue to project after creation', async () => {
      mockFetch
        .mockResolvedValueOnce(makeIssueMock())
        .mockResolvedValueOnce(makeProjectFetchMock())
        .mockResolvedValueOnce(makeProjectMutationMock());

      await service.createFeedback('user-uuid', 'My feedback comment here.');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      const mutationCall = mockFetch.mock.calls[2][1] as { body: string };
      const mutationBody = JSON.parse(mutationCall.body) as {
        variables: { projectId: string; contentId: string };
      };
      expect(mutationBody.variables.contentId).toBe(MOCK_ISSUE_NODE_ID);
      expect(mutationBody.variables.projectId).toBe(MOCK_PROJECT_NODE_ID);
    });

    it('caches project node ID across calls', async () => {
      mockFetch
        .mockResolvedValueOnce(makeIssueMock())
        .mockResolvedValueOnce(makeProjectFetchMock())
        .mockResolvedValueOnce(makeProjectMutationMock())
        .mockResolvedValueOnce(makeIssueMock())
        .mockResolvedValueOnce(makeProjectMutationMock()); // no project fetch on second call

      await service.createFeedback('user-uuid', 'First feedback comment here.');
      await service.createFeedback('user-uuid', 'Second feedback comment here.');

      // 5 calls total: issue + project fetch + mutation + issue + mutation (no second project fetch)
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('does not throw when project linking fails — returns issue URL anyway', async () => {
      mockFetch.mockResolvedValueOnce(makeIssueMock()).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('Forbidden'),
      });

      await expect(
        service.createFeedback('user-uuid', 'My feedback comment here.'),
      ).resolves.toEqual({
        issueUrl: MOCK_ISSUE_URL,
      });
    });

    it('does not link to project when GITHUB_PROJECT_NUMBER is not set', async () => {
      delete process.env.GITHUB_PROJECT_NUMBER;

      await service.createFeedback('user-uuid', 'My feedback comment here.');

      // Only 1 fetch call — the issue creation; no GraphQL calls
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
