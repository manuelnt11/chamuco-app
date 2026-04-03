/**
 * I18n Module
 *
 * Exports I18nService for use in other modules.
 */

import { Module } from '@nestjs/common';
import { I18nService } from './i18n.service';

@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nHelperModule {}
