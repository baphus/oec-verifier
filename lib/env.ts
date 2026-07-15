import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(), NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1), GMAIL_USER: z.string().email(), GMAIL_APP_PASSWORD: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"), RECEIPT_VALIDITY_HOURS: z.coerce.number().int().positive().default(24),
  RECEIPT_TOKEN_ENCRYPTION_KEY: z.string().min(1), RATE_LIMIT_HASH_SECRET: z.string().min(16),
  RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5), RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  EMAIL_DELIVERY_LEASE_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),
});
export function env() { return envSchema.parse(process.env); }
