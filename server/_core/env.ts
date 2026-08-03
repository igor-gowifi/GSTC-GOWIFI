import "dotenv/config";

export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "your-secret-key",
  isProduction: process.env.NODE_ENV === "production",
  // OAuth (not used in standalone Supabase auth)
  appId: process.env.VITE_APP_ID ?? "local-app",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "", // Now safely defaults to empty string
  // Freshdesk (optional)
  freshdeskDomain: process.env.FRESHDESK_DOMAIN ?? "",
  freshdeskApiKey: process.env.FRESHDESK_API_KEY ?? "",
  // Forge API (optional)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Owner info (optional)
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
};
