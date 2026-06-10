import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderDestinationsDto {
  @ApiProperty({
    description:
      'Ordered array of destination UUIDs. All destinations of the trip must be included. ' +
      'The array order defines the new positions (index 0 → position 1).',
    type: [String],
    example: ['uuid-a', 'uuid-b', 'uuid-c'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  destinationIds!: string[];
}
