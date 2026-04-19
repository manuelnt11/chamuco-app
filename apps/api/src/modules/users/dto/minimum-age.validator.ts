import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

interface DateLike {
  day: number;
  month: number;
  year: number;
}

function computeAge(value: unknown): number {
  if (!value || typeof value !== 'object') return -1;
  const { day, month, year } = value as DateLike;
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return -1;
  const birth = new Date(year, month - 1, day);
  if (isNaN(birth.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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
