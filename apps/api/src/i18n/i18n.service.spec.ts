/**
 * I18n Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from './i18n.service';
import { I18nService as NestI18nService } from 'nestjs-i18n';

describe('I18nService', () => {
  let service: I18nService;
  let mockNestI18nService: jest.Mocked<NestI18nService>;

  beforeEach(async () => {
    // Create mock for nestjs-i18n service
    mockNestI18nService = {
      translate: jest.fn(),
    } as unknown as jest.Mocked<NestI18nService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I18nService,
        {
          provide: NestI18nService,
          useValue: mockNestI18nService,
        },
      ],
    }).compile();

    service = module.get<I18nService>(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('translate', () => {
    it('should translate a key with default language (en)', () => {
      mockNestI18nService.translate.mockReturnValue('Resource not found');

      const result = service.translate('errors.notFound');

      expect(result).toBe('Resource not found');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('errors.notFound', {
        lang: 'en',
        args: undefined,
      });
    });

    it('should translate a key with specified language', () => {
      mockNestI18nService.translate.mockReturnValue('Recurso no encontrado');

      const result = service.translate('errors.notFound', { lang: 'es' });

      expect(result).toBe('Recurso no encontrado');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('errors.notFound', {
        lang: 'es',
        args: undefined,
      });
    });

    it('should translate a key with interpolation arguments', () => {
      mockNestI18nService.translate.mockReturnValue('Minimum length is 8 characters');

      const result = service.translate('common.validation.minLength', {
        lang: 'en',
        args: { count: 8 },
      });

      expect(result).toBe('Minimum length is 8 characters');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('common.validation.minLength', {
        lang: 'en',
        args: { count: 8 },
      });
    });

    it('should handle missing options', () => {
      mockNestI18nService.translate.mockReturnValue('Success');

      const result = service.translate('common.status.success');

      expect(result).toBe('Success');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('common.status.success', {
        lang: 'en',
        args: undefined,
      });
    });

    it('should handle empty args object', () => {
      mockNestI18nService.translate.mockReturnValue('Error');

      const result = service.translate('common.status.error', { args: {} });

      expect(result).toBe('Error');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('common.status.error', {
        lang: 'en',
        args: {},
      });
    });
  });

  describe('getValidationError', () => {
    it('should get validation error with default language', () => {
      mockNestI18nService.translate.mockReturnValue('This field is required');

      const result = service.getValidationError('required');

      expect(result).toBe('This field is required');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('common.validation.required', {
        lang: 'en',
        args: undefined,
      });
    });

    it('should get validation error with specified language', () => {
      mockNestI18nService.translate.mockReturnValue('Este campo es obligatorio');

      const result = service.getValidationError('required', { lang: 'es' });

      expect(result).toBe('Este campo es obligatorio');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('common.validation.required', {
        lang: 'es',
        args: undefined,
      });
    });

    it('should get validation error with interpolation', () => {
      mockNestI18nService.translate.mockReturnValue('La longitud mínima es 10 caracteres');

      const result = service.getValidationError('minLength', {
        lang: 'es',
        args: { count: 10 },
      });

      expect(result).toBe('La longitud mínima es 10 caracteres');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('common.validation.minLength', {
        lang: 'es',
        args: { count: 10 },
      });
    });

    it('should handle all validation error types', () => {
      const errorKeys = [
        'required',
        'invalidEmail',
        'minLength',
        'maxLength',
        'invalidFormat',
        'mustBePositive',
        'mustBeInteger',
      ];

      errorKeys.forEach((key) => {
        mockNestI18nService.translate.mockReturnValue(`Translated ${key}`);
        service.getValidationError(key);
        expect(mockNestI18nService.translate).toHaveBeenCalledWith(
          `common.validation.${key}`,
          expect.any(Object),
        );
      });
    });
  });

  describe('getError', () => {
    it('should get error message with default language', () => {
      mockNestI18nService.translate.mockReturnValue('Resource not found');

      const result = service.getError('notFound');

      expect(result).toBe('Resource not found');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('errors.notFound', {
        lang: 'en',
        args: undefined,
      });
    });

    it('should get error message with specified language', () => {
      mockNestI18nService.translate.mockReturnValue(
        'No estás autorizado para acceder a este recurso',
      );

      const result = service.getError('unauthorized', { lang: 'es' });

      expect(result).toBe('No estás autorizado para acceder a este recurso');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('errors.unauthorized', {
        lang: 'es',
        args: undefined,
      });
    });

    it('should handle all common error types', () => {
      const errorKeys = [
        'generic',
        'notFound',
        'unauthorized',
        'forbidden',
        'badRequest',
        'conflict',
        'internalServerError',
        'serviceUnavailable',
        'validation',
        'database',
      ];

      errorKeys.forEach((key) => {
        mockNestI18nService.translate.mockReturnValue(`Translated ${key}`);
        service.getError(key);
        expect(mockNestI18nService.translate).toHaveBeenCalledWith(
          `errors.${key}`,
          expect.any(Object),
        );
      });
    });
  });

  describe('getNotification', () => {
    it('should get notification message with default language', () => {
      mockNestI18nService.translate.mockReturnValue('The task "Review expenses" is due in 3 days');

      const result = service.getNotification('taskDueSoon', {
        args: { task: 'Review expenses', days: 3 },
      });

      expect(result).toBe('The task "Review expenses" is due in 3 days');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith('notifications.taskDueSoon', {
        lang: 'en',
        args: { task: 'Review expenses', days: 3 },
      });
    });

    it('should get notification message with specified language', () => {
      mockNestI18nService.translate.mockReturnValue('Juan te invitó al viaje "Cartagena 2026"');

      const result = service.getNotification('invitationReceived', {
        lang: 'es',
        args: { organizer: 'Juan', trip: 'Cartagena 2026' },
      });

      expect(result).toBe('Juan te invitó al viaje "Cartagena 2026"');
      expect(mockNestI18nService.translate).toHaveBeenCalledWith(
        'notifications.invitationReceived',
        {
          lang: 'es',
          args: { organizer: 'Juan', trip: 'Cartagena 2026' },
        },
      );
    });

    it('should handle all notification types', () => {
      const notificationKeys = [
        'invitationReceived',
        'taskDueSoon',
        'tripStartingSoon',
        'expenseAdded',
        'participantJoined',
      ];

      notificationKeys.forEach((key) => {
        mockNestI18nService.translate.mockReturnValue(`Translated ${key}`);
        service.getNotification(key);
        expect(mockNestI18nService.translate).toHaveBeenCalledWith(
          `notifications.${key}`,
          expect.any(Object),
        );
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined language gracefully', () => {
      mockNestI18nService.translate.mockReturnValue('Default');

      service.translate('test.key', { lang: undefined });

      expect(mockNestI18nService.translate).toHaveBeenCalledWith('test.key', {
        lang: 'en',
        args: undefined,
      });
    });

    it('should handle null args gracefully', () => {
      mockNestI18nService.translate.mockReturnValue('Default');

      service.translate('test.key', { args: null as unknown as Record<string, string | number> });

      expect(mockNestI18nService.translate).toHaveBeenCalledWith('test.key', {
        lang: 'en',
        args: null,
      });
    });

    it('should preserve numeric interpolation values', () => {
      mockNestI18nService.translate.mockReturnValue('Count: 0');

      service.translate('test.key', { args: { count: 0 } });

      expect(mockNestI18nService.translate).toHaveBeenCalledWith('test.key', {
        lang: 'en',
        args: { count: 0 },
      });
    });
  });
});
