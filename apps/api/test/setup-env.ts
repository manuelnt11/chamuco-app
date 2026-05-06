// Provide required env vars for e2e tests that bootstrap the full AppModule.
// Real values are not needed — the tests mock external services (Firebase, DB).
process.env.GEONAMES_USERNAME ??= 'test';
process.env.GOOGLE_CLOUD_STORAGE_BUCKET ??= 'test-bucket';
