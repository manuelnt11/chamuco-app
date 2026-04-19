/** Shared 30-day lifetime for both auth cookies (seconds) */
const MAX_AGE = 2592000;
// __Host- prefix enforces: Secure, path=/, no Domain — cookie is bound to
// chamucotravel.com only and cannot be set or read by any subdomain (e.g. api.chamucotravel.com).
const BASE = 'path=/; SameSite=Strict; Secure';

/** Set when Firebase reports a signed-in user (AuthProvider.onAuthStateChanged). */
export const COOKIE_CHAMUCO_AUTH_SET = `__Host-chamuco-auth=1; ${BASE}; Max-Age=${MAX_AGE}`;
export const COOKIE_CHAMUCO_AUTH_CLEAR = `__Host-chamuco-auth=; ${BASE}; Max-Age=0`;

/** Set once Chamuco registration is confirmed (sign-in 200 or onboarding register 201). */
export const COOKIE_CHAMUCO_REGISTERED_SET = `__Host-chamuco-registered=1; ${BASE}; Max-Age=${MAX_AGE}`;
export const COOKIE_CHAMUCO_REGISTERED_CLEAR = `__Host-chamuco-registered=; ${BASE}; Max-Age=0`;
