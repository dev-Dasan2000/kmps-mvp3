import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import checkDiskSpace from 'check-disk-space'; // npm install check-disk-space

const router = express.Router();

const UPLOAD_DIR = path.join('uploads', 'files');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const filePath = path.join(UPLOAD_DIR, file.originalname);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

/** 
 * Recursively scan a directory and sum file sizes by extension 
 */
function getFileSizesByType(dirPath) {
  const sizeMap = {
    '.dcm': 0,
    '.pdf': 0,
    '.docx': 0,
    others: 0,
  };

  function scan(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const { size } = fs.statSync(fullPath);
        if (sizeMap.hasOwnProperty(ext)) {
          sizeMap[ext] += size;
        } else {
          sizeMap.others += size;
        }
      }
    }
  }

  scan(dirPath);
  return sizeMap;
}

// --- Existing Routes ---

// Upload file
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/files/${req.file.filename}`;
  res.status(201).json({ url: fileUrl });
});

// Delete file
router.delete('/:fileName', (req, res) => {
  const { fileName } = req.params;
  if (!fileName) {
    return res.status(400).json({ error: 'File name is required' });
  }
  const filePath = path.join(UPLOAD_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  fs.unlinkSync(filePath);
  res.status(200).json({ message: 'File deleted successfully' });
});

// --- New: Storage Analysis Route ---

/**
 * GET /storage
 * Query params:
 *   - path: (optional) directory to analyze – defaults to UPLOAD_DIR
 *
 * Response JSON:
 * {
 *   fileSizes: { ".dcm": number, ".pdf": number, ".docx": number, others: number },
 *   diskStats: { total: number, free: number, used: number }
 * }
 */
router.get('/storage', async (req, res) => {
  try {
    // Resolve target directory (default to UPLOAD_DIR)
    const targetDir = req.query.path
      ? path.resolve(String(req.query.path))
      : path.resolve(UPLOAD_DIR); // ✅ absolute path

    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return res.status(400).json({ error: 'Invalid directory path' });
    }

    // 1. Get used size by file type
    const fileSizes = getFileSizesByType(targetDir);

    // 2. ✅ Fix for Windows: pass drive root (e.g., C:\) to checkDiskSpace
    const driveRoot = path.parse(targetDir).root;
    const { free, size: total } = await checkDiskSpace(driveRoot);
    const used = total - free;

    const bytesToGB = (bytes) => (bytes / (1024 ** 3)).toFixed(2)
    const totalgb = bytesToGB(total);
    const freegb = bytesToGB(free);
    const usedgb = bytesToGB(used);
    const dcmSize = (fileSizes['.dcm'] / (1024 ** 2)).toFixed(2); // Convert to MB
    const pdfSize = (fileSizes['.pdf'] / (1024 ** 2)).toFixed(2); // Convert to MB
    const docxSize = (fileSizes['.docx'] / (1024 ** 2)).toFixed(2); // Convert to MB
    const othersSize = (fileSizes.others / (1024 ** 2)).toFixed(2); // Convert to MB
    res.json({
      dcmSize,
      pdfSize,
      docxSize,
      othersSize,
      totalgb,
      freegb,
      usedgb 
    });
  } catch (err) {
    console.error('Storage analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze storage' });
  }
});


export default router;
