import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isDateAfter', async: false })
export class IsDateAfterConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string' || !value) return true;
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
    if (typeof relatedValue !== 'string' || !relatedValue) return true;
    return new Date(value) > new Date(relatedValue);
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}

export function IsDateAfter(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [property],
      validator: IsDateAfterConstraint,
    });
  };
}
