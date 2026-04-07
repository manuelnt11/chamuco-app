import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  describe('@Transform — username normalisation', () => {
    it('lowercases an uppercase username before validation', async () => {
      const dto = plainToInstance(RegisterDto, { username: 'JOHN_DOE' });
      expect(dto.username).toBe('john_doe');
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('leaves an already-lowercase username unchanged', async () => {
      const dto = plainToInstance(RegisterDto, { username: 'jane_doe' });
      expect(dto.username).toBe('jane_doe');
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('passes non-string values through unchanged (defensive branch)', async () => {
      // The Transform callback only lowercases strings; other types pass through
      // so that class-validator can produce the appropriate error.
      const dto = plainToInstance(RegisterDto, { username: 123 });
      expect(dto.username).toBe(123);
    });
  });

  describe('@Matches validation', () => {
    it('rejects a username that contains invalid characters', async () => {
      const dto = plainToInstance(RegisterDto, { username: 'invalid username!' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a username shorter than 3 characters', async () => {
      const dto = plainToInstance(RegisterDto, { username: 'ab' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
