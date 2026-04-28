import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
  "PORT",
  "JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
];

const optionalEnvVars = [
  "NODE_ENV",
  "JWT_EXPIRES_IN",
  "MAX_FILE_SIZE",
  "DEFAULT_ROTATION_DURATION",
];

export function validateEnv() {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error("\nPlease check your .env file");
    process.exit(1);
  }

  console.log("All required environment variables are present");
  console.log(`Running in ${process.env.NODE_ENV || "development"} mode`);
  console.log(`Server will run on port ${process.env.PORT}`);

  return true;
}
