import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { TripTaskScope } from '@chamuco/shared-types';
import { CreateTripTaskDto } from './create-trip-task.dto';
import { UpdateTripTaskDto } from './update-trip-task.dto';

describe('CreateTripTaskDto', () => {
  it('trims and collapses whitespace in title', async () => {
    const dto = plainToInstance(CreateTripTaskDto, {
      scope: TripTaskScope.PERSONAL,
      title: '  Pack   sunscreen  ',
    });

    expect(dto.title).toBe('Pack sunscreen');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a whitespace-only title', async () => {
    const dto = plainToInstance(CreateTripTaskDto, {
      scope: TripTaskScope.PERSONAL,
      title: '     ',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rejects an invalid scope', async () => {
    const dto = plainToInstance(CreateTripTaskDto, { scope: 'BOGUS', title: 'Valid title' });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'scope')).toBe(true);
  });
});

describe('UpdateTripTaskDto', () => {
  it('trims and collapses whitespace in title', async () => {
    const dto = plainToInstance(UpdateTripTaskDto, { title: '  Pack   reef-safe   sunscreen  ' });

    expect(dto.title).toBe('Pack reef-safe sunscreen');
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a whitespace-only title', async () => {
    const dto = plainToInstance(UpdateTripTaskDto, { title: '     ' });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });
});
