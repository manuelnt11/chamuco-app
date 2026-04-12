/** Shared 30-day lifetime for both auth cookies (seconds) */
const MAX_AGE = 2592000;
const BASE = 'path=/; SameSite=Strict; Secure';

/** Set when Firebase reports a signed-in user (AuthProvider.onAuthStateChanged). */
export const COOKIE_CHAMUCO_AUTH_SET = `chamuco-auth=1; ${BASE}; Max-Age=${MAX_AGE}`;
export const COOKIE_CHAMUCO_AUTH_CLEAR = `chamuco-auth=; ${BASE}; Max-Age=0`;

/** Set once Chamuco registration is confirmed (sign-in 200 or onboarding register 201). */
export const COOKIE_CHAMUCO_REGISTERED_SET = `chamuco-registered=1; ${BASE}; Max-Age=${MAX_AGE}`;
export const COOKIE_CHAMUCO_REGISTERED_CLEAR = `chamuco-registered=; ${BASE}; Max-Age=0`;
