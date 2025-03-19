import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const uploadMiddleware = upload.single('pdf');
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Use pdf-parse to extract text
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.replace(/\s+/g, ' ').trim();

    res.status(200).json({ text });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error processing PDF',
      error: error.message 
    });
  }
}