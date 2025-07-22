import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
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

// Upload signature for radiologist
router.post('/signature/:radiologistId', upload.single('signature'), async (req, res) => {
  try {
    const { radiologistId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No signature file uploaded' });
    }

    // Check if radiologist exists
    const radiologist = await prisma.radiologists.findUnique({
      where: { radiologist_id: radiologistId }
    });

    if (!radiologist) {
      // Delete the uploaded file if radiologist doesn't exist
      fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
      return res.status(404).json({ error: 'Radiologist not found' });
    }

    // If radiologist already has a signature, delete the old file
    if (radiologist.signature) {
      const oldFileName = radiologist.signature.split('/').pop();
      const oldFilePath = path.join(UPLOAD_DIR, oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const fileUrl = `/uploads/photos/${req.file.filename}`;

    // Update radiologist with new signature URL
    await prisma.radiologists.update({
      where: { radiologist_id: radiologistId },
      data: { signature: fileUrl }
    });

    res.status(200).json({ 
      message: 'Signature uploaded successfully',
      url: fileUrl 
    });
  } catch (error) {
    // If any error occurs, delete the uploaded file
    if (req.file) {
      const filePath = path.join(UPLOAD_DIR, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.error('Signature upload error:', error);
    res.status(500).json({ error: 'Signature upload failed' });
  }
});

export default router;
