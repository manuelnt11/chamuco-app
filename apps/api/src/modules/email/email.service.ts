import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailTemplate } from './email-template.enum';

export interface SendMailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  context: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    cfg: ConfigService,
  ) {
    this.frontendUrl = cfg.get<string>('FRONTEND_URL')!;
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    await this.mailerService.sendMail({
      to: options.to,
      subject: options.subject,
      template: options.template,
      context: {
        ...options.context,
        frontendUrl: this.frontendUrl,
        currentYear: new Date().getFullYear(),
      },
    });
    this.logger.log(`Email sent: template=${options.template} to=${options.to}`);
  }

  async sendWelcome(options: { to: string; displayName: string }): Promise<void> {
    // TODO: replace hardcoded subject with i18n once user language preferences are implemented
    await this.sendMail({
      to: options.to,
      subject: 'Welcome to Chamuco Travel',
      template: EmailTemplate.WELCOME,
      context: { displayName: options.displayName },
    });
  }
}
