import { plainToInstance } from 'class-transformer';
import { ExportField, ExportFormat } from '@chamuco/shared-types';
import { ExportParticipantsQueryDto } from './export-participants-query.dto';

describe('ExportParticipantsQueryDto', () => {
  describe('format field', () => {
    it('defaults to CSV when not provided', () => {
      const dto = plainToInstance(ExportParticipantsQueryDto, {});
      expect(dto.format).toBe(ExportFormat.CSV);
    });

    it('accepts xlsx value', () => {
      const dto = plainToInstance(ExportParticipantsQueryDto, { format: 'xlsx' });
      expect(dto.format).toBe(ExportFormat.XLSX);
    });
  });

  describe('fields @Transform', () => {
    it('returns undefined when value is absent', () => {
      const dto = plainToInstance(ExportParticipantsQueryDto, {});
      expect(dto.fields).toBeUndefined();
    });

    it('returns undefined when value is empty string', () => {
      const dto = plainToInstance(ExportParticipantsQueryDto, { fields: '' });
      expect(dto.fields).toBeUndefined();
    });

    it('splits comma-separated string into array', () => {
      const dto = plainToInstance(ExportParticipantsQueryDto, {
        fields: 'displayName,email,role',
      });
      expect(dto.fields).toEqual([ExportField.DISPLAY_NAME, ExportField.EMAIL, ExportField.ROLE]);
    });

    it('handles repeated array values (NestJS query param array)', () => {
      const dto = plainToInstance(ExportParticipantsQueryDto, {
        fields: [ExportField.FIRST_NAME, ExportField.LAST_NAME],
      });
      expect(dto.fields).toEqual([ExportField.FIRST_NAME, ExportField.LAST_NAME]);
    });

    it('trims whitespace from individual field values', () => {
      const dto = plainToInstance(ExportParticipantsQueryDto, {
        fields: ' displayName , email ',
      });
      expect(dto.fields).toEqual([ExportField.DISPLAY_NAME, ExportField.EMAIL]);
    });

    it('filters out empty entries from comma-separated string', () => {
      const dto = plainToInstance(ExportParticipantsQueryDto, { fields: 'displayName,,email' });
      expect(dto.fields).toEqual([ExportField.DISPLAY_NAME, ExportField.EMAIL]);
    });
  });
});
