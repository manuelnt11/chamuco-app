import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsHealthDescription(
  enumFieldName: string,
  otherValue: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'isHealthDescription',
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [enumFieldName, otherValue],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [enumField, other] = args.constraints as [string, string];
          const enumValue = (args.object as Record<string, unknown>)[enumField];
          if (enumValue === other) {
            return typeof value === 'string' && value.trim().length > 0;
          }
          return value === null || value === undefined || typeof value === 'string';
        },
        defaultMessage(args: ValidationArguments) {
          const [enumField, other] = args.constraints as [string, string];
          const enumValue = (args.object as Record<string, unknown>)[enumField];
          if (enumValue === other) {
            return `${args.property} must be a non-empty string when ${enumField} is ${other}`;
          }
          return `${args.property} must be a string or null`;
        },
      },
    });
  };
}
