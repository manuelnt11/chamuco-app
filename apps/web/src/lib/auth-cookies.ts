const MAX_AGE = 2592000;

// In production (HTTPS): use __Host- prefix which enforces Secure + path=/ + no Domain.
// In development (HTTP): __Host- prefix requires a secure origin — Safari rejects it on
// localhost. Chrome accepts Secure cookies on localhost but Safari does not. Drop the
// prefix and the Secure flag in development so routing cookies are set in all browsers.
const isProd = process.env.NODE_ENV === 'production';
const SECURE = isProd ? '; Secure' : '';
const BASE = `path=/; SameSite=Strict${SECURE}`;

export const COOKIE_CHAMUCO_AUTH_NAME = isProd ? '__Host-chamuco-auth' : 'chamuco-auth';
export const COOKIE_CHAMUCO_AUTH_SET = `${COOKIE_CHAMUCO_AUTH_NAME}=1; ${BASE}; Max-Age=${MAX_AGE}`;
export const COOKIE_CHAMUCO_AUTH_CLEAR = `${COOKIE_CHAMUCO_AUTH_NAME}=; ${BASE}; Max-Age=0`;

export const COOKIE_CHAMUCO_REGISTERED_NAME = isProd
  ? '__Host-chamuco-registered'
  : 'chamuco-registered';
export const COOKIE_CHAMUCO_REGISTERED_SET = `${COOKIE_CHAMUCO_REGISTERED_NAME}=1; ${BASE}; Max-Age=${MAX_AGE}`;
export const COOKIE_CHAMUCO_REGISTERED_CLEAR = `${COOKIE_CHAMUCO_REGISTERED_NAME}=; ${BASE}; Max-Age=0`;
