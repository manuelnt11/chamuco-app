import { UploadType } from '@chamuco/shared-types';
export { UploadType } from '@chamuco/shared-types';

export const UPLOAD_SIZE_LIMITS_BYTES: Record<UploadType, number> = {
  [UploadType.USER_AVATAR]: 2 * 1024 * 1024,
  [UploadType.GROUP_COVER]: 5 * 1024 * 1024,
  [UploadType.GROUP_RESOURCE_DOCUMENT]: 20 * 1024 * 1024,
  [UploadType.TRIP_COVER]: 5 * 1024 * 1024,
  [UploadType.TRIP_RESOURCE]: 20 * 1024 * 1024,
};

export const ALLOWED_CONTENT_TYPES: Record<UploadType, string[]> = {
  [UploadType.USER_AVATAR]: ['image/jpeg', 'image/png', 'image/webp'],
  [UploadType.GROUP_COVER]: ['image/jpeg', 'image/png', 'image/webp'],
  [UploadType.GROUP_RESOURCE_DOCUMENT]: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  [UploadType.TRIP_COVER]: ['image/jpeg', 'image/png', 'image/webp'],
  [UploadType.TRIP_RESOURCE]: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const OBJECT_KEY_PREFIXES: Record<UploadType, string> = {
  [UploadType.USER_AVATAR]: 'avatars',
  [UploadType.GROUP_COVER]: 'group-covers',
  [UploadType.GROUP_RESOURCE_DOCUMENT]: 'group-resources',
  [UploadType.TRIP_COVER]: 'trip-covers',
  [UploadType.TRIP_RESOURCE]: 'trip-resources',
};

export const DOWNLOAD_TTL_SECONDS: Record<UploadType, number> = {
  [UploadType.USER_AVATAR]: 7 * 24 * 60 * 60,
  [UploadType.GROUP_COVER]: 7 * 24 * 60 * 60,
  [UploadType.GROUP_RESOURCE_DOCUMENT]: 60 * 60,
  [UploadType.TRIP_COVER]: 7 * 24 * 60 * 60,
  [UploadType.TRIP_RESOURCE]: 60 * 60,
};

export const UPLOAD_URL_TTL_SECONDS = 15 * 60;

export const OBJECT_KEY_TO_UPLOAD_TYPE: Record<string, UploadType> = {
  avatars: UploadType.USER_AVATAR,
  'group-covers': UploadType.GROUP_COVER,
  'group-resources': UploadType.GROUP_RESOURCE_DOCUMENT,
  'trip-covers': UploadType.TRIP_COVER,
  'trip-resources': UploadType.TRIP_RESOURCE,
};

export const PUBLIC_OBJECT_PREFIXES: ReadonlySet<string> = new Set([
  'avatars',
  'group-covers',
  'trip-covers',
]);
