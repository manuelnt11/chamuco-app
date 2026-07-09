import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { computeAge as computeAgeFromDob } from '@chamuco/shared-utils';

interface DateLike {
  day: number;
  month: number;
  year: number;
}

function computeAge(value: unknown): number {
  if (!value || typeof value !== 'object') return -1;
  const { day, month, year } = value as DateLike;
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return -1;
  return computeAgeFromDob(day, month, year);
}

export function IsMinimumAge(
  minAge: number,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'isMinimumAge',
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [minAge],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [min] = args.constraints as [number];
          return computeAge(value) >= min;
        },
        defaultMessage(args: ValidationArguments): string {
          const [min] = args.constraints as [number];
          return `You must be at least ${min} years old to register`;
        },
      },
    });
  };
}

export { computeAge };
