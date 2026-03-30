#!/usr/bin/env node

/**
 * Gets an IAM authentication token for Cloud SQL
 * This token is used as the password when connecting with IAM authentication
 */
async function getIAMToken() {
  // In Cloud Run, we can get the token from the metadata server
  // Request token with Cloud SQL scope
  const metadataServerUrl =
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token?scopes=https://www.googleapis.com/auth/sqlservice.admin';

  try {
    const response = await fetch(metadataServerUrl, {
      headers: {
        'Metadata-Flavor': 'Google',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Failed to get IAM token:', error);
    throw error;
  }
}

module.exports = { getIAMToken };

// If run directly, output the token
if (require.main === module) {
  getIAMToken()
    .then((token) => {
      console.log(token);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
