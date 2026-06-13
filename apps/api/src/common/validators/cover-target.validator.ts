import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

const MAX_EMOJI_LENGTH = 8;

// Replaces @IsString + @IsNotEmpty + @ValidateIf + @MaxLength(8) — @ValidateIf skips ALL validators on a property when any condition is false.
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
          if (typeof args.value !== 'string' || (args.value as string).trim().length === 0) {
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
