import { validate } from 'class-validator';
import { IsValidCoverTarget } from './cover-target.validator';

class TestDto {
  source!: 'emoji' | 'gcs';

  @IsValidCoverTarget()
  target!: string;
}

async function runValidation(source: 'emoji' | 'gcs', target: unknown) {
  const dto = Object.assign(new TestDto(), { source, target });
  return validate(dto);
}

describe('IsValidCoverTarget', () => {
  describe('emoji source', () => {
    it('passes for a valid emoji (single char)', async () => {
      const errors = await runValidation('emoji', '🏖️');
      expect(errors).toHaveLength(0);
    });

    it('passes for a valid emoji (exactly 8 chars)', async () => {
      const errors = await runValidation('emoji', '12345678');
      expect(errors).toHaveLength(0);
    });

    it('fails when target exceeds 8 chars', async () => {
      const errors = await runValidation('emoji', '123456789');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints?.['isValidCoverTarget']).toMatch(/8 characters/);
    });

    it('fails for empty string', async () => {
      const errors = await runValidation('emoji', '');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints?.['isValidCoverTarget']).toBe('target must not be empty');
    });

    it('fails for whitespace-only string', async () => {
      const errors = await runValidation('emoji', '   ');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints?.['isValidCoverTarget']).toBe('target must not be empty');
    });
  });

  describe('gcs source', () => {
    it('passes for a valid object key regardless of length', async () => {
      const errors = await runValidation(
        'gcs',
        'trip-covers/trip-uuid/some-very-long-filename.jpg',
      );
      expect(errors).toHaveLength(0);
    });

    it('passes for a key that is exactly 1 char', async () => {
      const errors = await runValidation('gcs', 'x');
      expect(errors).toHaveLength(0);
    });

    it('fails for empty string', async () => {
      const errors = await runValidation('gcs', '');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('fails for whitespace-only string', async () => {
      const errors = await runValidation('gcs', '   ');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('fails for non-string value', async () => {
      const errors = await runValidation('gcs', 123);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
