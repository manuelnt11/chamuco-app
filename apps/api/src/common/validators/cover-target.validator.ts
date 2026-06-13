import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

const MAX_EMOJI_LENGTH = 8;

/**
 * Validates a cover DTO's `target` field.
 * - Always: non-empty string
 * - When source === 'emoji': max 8 chars
 * - When source === 'gcs': any non-empty string (object key)
 *
 * Use in place of @IsString() + @IsNotEmpty() + @ValidateIf + @MaxLength(8)
 * to avoid class-validator's @ValidateIf skipping all validators on the property.
 */
export function IsValidCoverTarget(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isValidCoverTarget',
      target: (object as { constructor: new (...args: unknown[]) => unknown }).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const dto = args.object as { source?: string };
          if (typeof value !== 'string' || value.trim().length === 0) return false;
          if (dto.source === 'emoji' && value.length > MAX_EMOJI_LENGTH) return false;
          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          const dto = args.object as { source?: string };
          if (typeof args.value !== 'string' || String(args.value).trim().length === 0) {
            return 'target must not be empty';
          }
          if (dto.source === 'emoji') {
            return `Emoji cover target must be at most ${MAX_EMOJI_LENGTH} characters`;
          }
          return 'cover target is invalid';
        },
      },
    });
  };
}
