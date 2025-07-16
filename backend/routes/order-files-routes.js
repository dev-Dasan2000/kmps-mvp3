import express from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = express.Router();
const UPLOAD_DIR = path.join('uploads', 'files');

router.get('/', async (req, res) => {
  try {
    const files = await prisma.order_files.findMany();
    res.json(files);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order files' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { url, order_id } = req.body;
    const file = await prisma.order_files.create({ data: { url, order_id } });
    res.status(201).json(file);
  } catch {
    res.status(500).json({ error: 'Failed to create order file' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const fileId = Number(req.params.id);

    // Step 1: Fetch the file record
    const fileRecord = await prisma.order_files.findUnique({
      where: { file_id: fileId },
    });

    if (!fileRecord) {
      return res.status(404).json({ error: 'Order file not found' });
    }

    // Step 2: Delete the file from the filesystem
    const filePath = path.join(UPLOAD_DIR, fileRecord.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`Failed to delete physical file: ${filePath}`, err);
        return res.status(500).json({ error: 'Failed to delete file from filesystem' });
      }
    }

    // Step 3: Delete the DB record
    await prisma.order_files.delete({
      where: { file_id: fileId },
    });

    res.json({ message: 'Order file deleted successfully' });
  } catch (err) {
    console.error('Delete order file failed:', err);
    res.status(500).json({ error: 'Failed to delete order file' });
  }
});


export default router;
