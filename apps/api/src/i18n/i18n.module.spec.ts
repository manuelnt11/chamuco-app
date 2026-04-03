/**
 * I18n Module Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from './i18n.service';
import { I18nService as NestI18nService } from 'nestjs-i18n';

describe('I18nHelperModule', () => {
  let module: TestingModule;
  let mockNestI18nService: { translate: jest.Mock };

  beforeEach(async () => {
    // Create mock for nestjs-i18n service
    mockNestI18nService = {
      translate: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        I18nService,
        {
          provide: NestI18nService,
          useValue: mockNestI18nService,
        },
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide I18nService', () => {
    const service = module.get<I18nService>(I18nService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(I18nService);
  });

  it('should inject NestI18nService into I18nService', () => {
    const service = module.get<I18nService>(I18nService);
    mockNestI18nService.translate.mockReturnValue('Test');

    service.translate('test.key');

    expect(mockNestI18nService.translate).toHaveBeenCalled();
  });
});
