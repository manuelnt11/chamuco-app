import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsHealthDescription(
  enumFieldName: string,
  otherValue: string,
  maxLength: number,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'isHealthDescription',
      target: object.constructor,
      propertyName: propertyName as string,
      constraints: [enumFieldName, otherValue, maxLength],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [enumField, other, max] = args.constraints as [string, string, number];
          const enumValue = (args.object as Record<string, unknown>)[enumField];
          if (enumValue === other) {
            return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
          }
          return (
            value === null ||
            value === undefined ||
            (typeof value === 'string' && value.length <= max)
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [enumField, other, max] = args.constraints as [string, string, number];
          const enumValue = (args.object as Record<string, unknown>)[enumField];
          if (enumValue === other) {
            return `${args.property} must be a non-empty string of at most ${max} characters when ${enumField} is ${other}`;
          }
          return `${args.property} must be a string of at most ${max} characters, or null`;
        },
      },
    });
  };
}
