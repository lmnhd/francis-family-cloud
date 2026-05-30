import { z } from "zod";

const envSchema = z.object({
  // AWS identity — server-only, never expose to browser
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  // Storage
  AWS_S3_BUCKET: z.string().min(1),

  // Metadata
  DYNAMODB_TABLE_NAME: z.string().min(1),

  // Auth.js v5
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),

  // Provider imports (server-only)
  DROPBOX_APP_KEY: z.string().min(1).optional(),
  DROPBOX_APP_SECRET: z.string().min(1).optional(),
  DROPBOX_REDIRECT_URI: z.string().url().optional(),

  // Runtime
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

// Set SKIP_ENV_VALIDATION=true in CI build pipelines that lack real secrets.
// The app will throw at request time if vars are actually missing.
const parsed = process.env.SKIP_ENV_VALIDATION
  ? ({} as z.infer<typeof envSchema>)
  : envSchema.parse(process.env);

export const env = parsed;
