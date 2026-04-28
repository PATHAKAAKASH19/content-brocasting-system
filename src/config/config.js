
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  allowedFileTypes: (
    process.env.ALLOWED_FILE_TYPES || "image/jpeg,image/png,image/gif"
  ).split(","),
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  getUploadPath: () => path.join(__dirname, "../../", config.uploadDir),
  defaultRotationDuration: parseInt(process.env.DEFAULT_ROTATION_DURATION) || 5,
  isProduction: () => config.nodeEnv === "production",
  isDevelopment: () => config.nodeEnv === "development",
};

export default config;
