import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || !value) return true;
    const d = new Date(value);
    if (isNaN(d.getTime())) return true; // let IsDateString handle invalid format
    const today = new Date().toISOString().split('T')[0] as string;
    return value <= today;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must not be a future date`;
  }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [],
      validator: IsNotFutureDateConstraint,
    });
  };
}
