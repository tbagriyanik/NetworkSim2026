'use server';

export interface EnvStatus {
  hasEnv: boolean;
  hasSheetsKey: boolean;
  hasKvKeys: boolean;
  hasCertSecret: boolean;
  hasExamHmacKey: boolean;
}

export async function checkEnvStatus(): Promise<EnvStatus> {
  const hasSheetsKey = Boolean(process.env.GOOGLE_SHEETS_CONTACT_URL);
  const hasKvKeys = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const hasCertSecret = Boolean(process.env.CERTIFICATE_SECRET);
  const hasExamHmacKey = Boolean(process.env.EXAM_HMAC_KEY);

  // If none of the keys exist, consider .env as unconfigured/missing
  const hasEnv = hasSheetsKey || hasKvKeys || hasCertSecret || hasExamHmacKey || Boolean(process.env.APP_URL);

  return {
    hasEnv,
    hasSheetsKey,
    hasKvKeys,
    hasCertSecret,
    hasExamHmacKey,
  };
}


