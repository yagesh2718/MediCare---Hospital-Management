import { NextResponse } from "next/server";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Setup multer
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Middleware wrapper
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  return new Promise((resolve, reject) => {
    upload.single("file")(req, {}, (err) => {
      if (err) {
        reject(NextResponse.json({ error: "Upload failed" }, { status: 500 }));
      } else {
        const filename = req.file.filename;
        resolve(NextResponse.json({ url: `/uploads/${filename}` }));
      }
    });
  });
}
