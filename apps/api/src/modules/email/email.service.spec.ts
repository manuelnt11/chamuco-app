import type { ConfigService } from '@nestjs/config';
import type { MailerService } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { EmailTemplate } from './email-template.enum';

function makeService(sendMailFn: jest.Mock, frontendUrl = 'https://app.test') {
  const mailerService = { sendMail: sendMailFn } as unknown as MailerService;
  const cfg = { get: jest.fn().mockReturnValue(frontendUrl) } as unknown as ConfigService;
  return new EmailService(mailerService, cfg);
}

describe('EmailService', () => {
  describe('sendMail()', () => {
    it('delegates to MailerService.sendMail appending frontendUrl and currentYear', async () => {
      const sendMail = jest.fn().mockResolvedValue(undefined);
      const service = makeService(sendMail, 'https://app.test');

      await service.sendMail({
        to: 'user@example.com',
        subject: 'Test',
        template: EmailTemplate.TRIP_INVITATION,
        context: { tripName: 'Summer 2025' },
      });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test',
          template: EmailTemplate.TRIP_INVITATION,
          context: expect.objectContaining({
            tripName: 'Summer 2025',
            frontendUrl: 'https://app.test',
            currentYear: expect.any(Number),
          }),
        }),
      );
    });

    it('rethrows when MailerService.sendMail throws', async () => {
      const sendMail = jest.fn().mockRejectedValue(new Error('SMTP error'));
      const service = makeService(sendMail);

      await expect(
        service.sendMail({
          to: 'user@example.com',
          subject: 'Test',
          template: EmailTemplate.WELCOME,
          context: {},
        }),
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('sendWelcome()', () => {
    it('sends with WELCOME template and displayName context', async () => {
      const sendMail = jest.fn().mockResolvedValue(undefined);
      const service = makeService(sendMail);

      await service.sendWelcome({ to: 'ana@example.com', displayName: 'Ana García' });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ana@example.com',
          template: EmailTemplate.WELCOME,
          context: expect.objectContaining({ displayName: 'Ana García' }),
        }),
      );
    });

    it('rethrows when underlying sendMail throws', async () => {
      const sendMail = jest.fn().mockRejectedValue(new Error('conn refused'));
      const service = makeService(sendMail);

      await expect(service.sendWelcome({ to: 'x@x.com', displayName: 'X' })).rejects.toThrow(
        'conn refused',
      );
    });
  });
});
