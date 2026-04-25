import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserThrottlerGuard } from '@/common/guards/user-throttler.guard';

describe('UserThrottlerGuard', () => {
  let guard: UserThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }])],
      providers: [UserThrottlerGuard],
    }).compile();

    guard = module.get<UserThrottlerGuard>(UserThrottlerGuard);
  });

  describe('getTracker', () => {
    it('returns user.id when user is authenticated', async () => {
      const req = { user: { id: 'user-uuid-123' } };
      const result = await guard['getTracker'](req);
      expect(result).toBe('user-uuid-123');
    });

    it('falls back to req.ip when user is not set', async () => {
      const req = { ip: '192.168.1.1' };
      const result = await guard['getTracker'](req);
      expect(result).toBe('192.168.1.1');
    });

    it('falls back to socket.remoteAddress when user and ip are absent', async () => {
      const req = { socket: { remoteAddress: '10.0.0.1' } };
      const result = await guard['getTracker'](req);
      expect(result).toBe('10.0.0.1');
    });

    it('returns "unknown" when all sources are absent', async () => {
      const result = await guard['getTracker']({});
      expect(result).toBe('unknown');
    });

    it('prefers user.id over req.ip when both are present', async () => {
      const req = { user: { id: 'user-uuid-123' }, ip: '192.168.1.1' };
      const result = await guard['getTracker'](req);
      expect(result).toBe('user-uuid-123');
    });

    it('prefers req.ip over socket.remoteAddress when user is absent', async () => {
      const req = { ip: '192.168.1.1', socket: { remoteAddress: '10.0.0.1' } };
      const result = await guard['getTracker'](req);
      expect(result).toBe('192.168.1.1');
    });
  });
});
