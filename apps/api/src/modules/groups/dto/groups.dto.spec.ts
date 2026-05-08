import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { GroupVisibility } from '@chamuco/shared-types';
import { GroupCoverDto } from './group-cover.dto';
import { CreateGroupDto } from './create-group.dto';
import { UpdateGroupDto } from './update-group.dto';

describe('GroupCoverDto', () => {
  it('accepts a valid emoji cover', async () => {
    const dto = plainToInstance(GroupCoverDto, { source: 'emoji', target: '🏔️' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a valid gcs cover with fileSize', async () => {
    const dto = plainToInstance(GroupCoverDto, {
      source: 'gcs',
      target: 'group-covers/id/photo.jpg',
      fileSize: 512000,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects emoji target longer than 8 characters', async () => {
    const dto = plainToInstance(GroupCoverDto, { source: 'emoji', target: 'toolongvalue' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects gcs source with fileSize below minimum', async () => {
    const dto = plainToInstance(GroupCoverDto, {
      source: 'gcs',
      target: 'group-covers/id/photo.jpg',
      fileSize: 0,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects gcs source with missing fileSize', async () => {
    const dto = plainToInstance(GroupCoverDto, {
      source: 'gcs',
      target: 'group-covers/id/photo.jpg',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('CreateGroupDto', () => {
  it('trims and uppercases name via Transform', () => {
    const dto = plainToInstance(CreateGroupDto, {
      name: '  mountain crew  ',
      visibility: GroupVisibility.PUBLIC,
      cover: { source: 'emoji', target: '🏔️' },
    });
    expect(dto.name).toBe('MOUNTAIN CREW');
  });

  it('creates nested GroupCoverDto via Type', () => {
    const dto = plainToInstance(CreateGroupDto, {
      name: 'Mountain Crew',
      visibility: GroupVisibility.PUBLIC,
      cover: { source: 'emoji', target: '🏔️' },
    });
    expect(dto.cover).toBeInstanceOf(GroupCoverDto);
  });
});

describe('UpdateGroupDto', () => {
  it('trims and uppercases name via Transform', () => {
    const dto = plainToInstance(UpdateGroupDto, { name: '  updated crew  ' });
    expect(dto.name).toBe('UPDATED CREW');
  });

  it('creates nested GroupCoverDto via Type', () => {
    const dto = plainToInstance(UpdateGroupDto, { cover: { source: 'emoji', target: '🌴' } });
    expect(dto.cover).toBeInstanceOf(GroupCoverDto);
  });

  it('accepts null description to clear the field', async () => {
    const dto = plainToInstance(UpdateGroupDto, { description: null });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.description).toBeNull();
  });

  it('rejects empty string description', async () => {
    const dto = plainToInstance(UpdateGroupDto, { description: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
