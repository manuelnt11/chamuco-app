// Shared utility functions for Chamuco App
// This file serves as the main export barrel for all shared utilities

/**
 * Document ID format: uppercase letters, digits, and interior hyphens only.
 * No leading or trailing hyphens. Applies to national IDs, passport numbers,
 * and ETA authorization numbers.
 *
 * Valid:   A1B2C3, AB-123456, 12345678, A-BC-123
 * Invalid: -AB123, AB123-, AB 123, ab123
 */
export const DOCUMENT_ID_FORMAT_REGEX = /^[A-Z0-9]([A-Z0-9-]*[A-Z0-9])?$/;
