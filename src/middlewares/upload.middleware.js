
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);
  const isExtAllowed = allowedExtensions.includes(ext);

  if (isMimeAllowed && isExtAllowed) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only ${allowedExtensions.join(", ")} files are allowed.`,
      ),
      false,
    );
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

export const uploadSingle = upload.single("file");

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};



export const validateContentFields = (req, res, next) => {
  const { title, subject, start_time, end_time } = req.body;
  
  const errors = [];
  
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!subject || subject.trim().length === 0) {
    errors.push('Subject is required');
  }
  
  if (!start_time) {
    errors.push('Start time is required');
  }
  
  if (!end_time) {
    errors.push('End time is required');
  }
  
 
  if (start_time && end_time) {
    const start = new Date(start_time);
    const end = new Date(end_time);
    
    
    if (isNaN(start.getTime())) {
      errors.push(`Invalid start_time format: "${start_time}". Use ISO format like "2024-01-15T00:00:00.000Z"`);
    }
    if (isNaN(end.getTime())) {
      errors.push(`Invalid end_time format: "${end_time}". Use ISO format like "2024-01-15T00:00:00.000Z"`);
    }
    
   
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start >= end) {
      errors.push('end_time must be after start_time');
    }
  }
  
  if (errors.length > 0) {
  
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  next();
};