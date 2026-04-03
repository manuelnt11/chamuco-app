/**
 * I18n Service
 *
 * Provides helper methods for translating messages in the backend.
 * Wraps nestjs-i18n's I18nService with convenience methods.
 */

import { Injectable } from '@nestjs/common';
import { I18nService as NestI18nService } from 'nestjs-i18n';

export type SupportedLanguage = 'en' | 'es';

/**
 * Translation options for interpolation
 */
export interface TranslateOptions {
  lang?: SupportedLanguage;
  args?: Record<string, string | number>;
}

@Injectable()
export class I18nService {
  constructor(private readonly i18n: NestI18nService) {}

  /**
   * Translate a key with optional interpolation arguments
   *
   * @param key - Translation key in dot notation (e.g., 'errors.notFound')
   * @param options - Language and interpolation arguments
   * @returns Translated string
   *
   * @example
   * ```typescript
   * this.i18n.translate('errors.notFound', { lang: 'es' });
   * // => "Recurso no encontrado"
   *
   * this.i18n.translate('notifications.taskDueSoon', {
   *   lang: 'en',
   *   args: { task: 'Review expenses', days: 3 }
   * });
   * // => "The task \"Review expenses\" is due in 3 days"
   * ```
   */
  translate(key: string, options?: TranslateOptions): string {
    const lang = options?.lang || 'en';
    return this.i18n.translate(key, {
      lang,
      args: options?.args,
    }) as string;
  }

  /**
   * Get a validation error message
   *
   * @param errorKey - Validation error key (without 'common.validation.' prefix)
   * @param options - Language and interpolation arguments
   * @returns Translated validation error message
   *
   * @example
   * ```typescript
   * this.i18n.getValidationError('required', { lang: 'es' });
   * // => "Este campo es obligatorio"
   *
   * this.i18n.getValidationError('minLength', {
   *   lang: 'en',
   *   args: { count: 8 }
   * });
   * // => "Minimum length is 8 characters"
   * ```
   */
  getValidationError(errorKey: string, options?: TranslateOptions): string {
    return this.translate(`common.validation.${errorKey}`, options);
  }

  /**
   * Get an error message
   *
   * @param errorKey - Error key (without 'errors.' prefix)
   * @param options - Language and interpolation arguments
   * @returns Translated error message
   *
   * @example
   * ```typescript
   * this.i18n.getError('notFound', { lang: 'es' });
   * // => "Recurso no encontrado"
   * ```
   */
  getError(errorKey: string, options?: TranslateOptions): string {
    return this.translate(`errors.${errorKey}`, options);
  }

  /**
   * Get a notification message
   *
   * @param notificationKey - Notification key (without 'notifications.' prefix)
   * @param options - Language and interpolation arguments
   * @returns Translated notification message
   *
   * @example
   * ```typescript
   * this.i18n.getNotification('taskDueSoon', {
   *   lang: 'en',
   *   args: { task: 'Review expenses', days: 3 }
   * });
   * // => "The task \"Review expenses\" is due in 3 days"
   * ```
   */
  getNotification(notificationKey: string, options?: TranslateOptions): string {
    return this.translate(`notifications.${notificationKey}`, options);
  }
}
