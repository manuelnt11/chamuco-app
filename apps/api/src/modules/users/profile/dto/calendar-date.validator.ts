import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface DateFields {
  month?: number;
  year?: number;
}

@ValidatorConstraint({ name: 'isRealCalendarDay', async: false })
export class IsRealCalendarDayConstraint implements ValidatorConstraintInterface {
  validate(day: unknown, args: ValidationArguments): boolean {
    if (typeof day !== 'number') return true;
    const { month, year } = args.object as DateFields;
    if (!month || !year) return true;
    // Skip when month/year are out of their valid ranges — those validators handle it.
    if (month < 1 || month > 12) return true;
    if (year < 1900) return true;
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  }

  defaultMessage(): string {
    return 'date does not exist in the calendar (e.g. February 31 is invalid)';
  }
}

export function IsRealCalendarDay(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsRealCalendarDayConstraint,
    });
  };
}
