import multer from "multer";
import path from "path";
import fs from "fs";
import { originalsDir } from "../services/puzzleImage.service";

const dir = originalsDir();
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `puzzle_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

export const uploadImage = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new Error("Chỉ hỗ trợ ảnh PNG, JPEG hoặc WEBP"));
    }
    cb(null, true);
  },
});
