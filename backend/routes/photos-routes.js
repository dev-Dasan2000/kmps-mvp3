import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const UPLOAD_DIR = path.join('uploads', 'photos');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload photo
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
  
    const fileUrl = `/uploads/photos/${req.file.filename}`;
    res.status(201).json({ url: fileUrl });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Photo upload failed' });
  }
});

// Delete photo
router.delete('/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    // Prevent directory traversal
    const safeFileName = path.basename(fileName);
    const filePath = path.join(UPLOAD_DIR, safeFileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);
    
    res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Photo deletion error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
