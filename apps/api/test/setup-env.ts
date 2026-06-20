// Provide required env vars for e2e tests that bootstrap the full AppModule.
// Real values are not needed — the tests mock external services (Firebase, DB).
process.env.GEONAMES_USERNAME ??= 'test';
process.env.GOOGLE_CLOUD_STORAGE_BUCKET ??= 'test-bucket';
process.env.SMTP_HOST ??= 'smtp.test.invalid';
process.env.SMTP_USER ??= 'test';
process.env.SMTP_PASS ??= 'test';
process.env.SMTP_FROM ??= 'test@test.invalid';
process.env.FRONTEND_URL ??= 'http://localhost:3000';
