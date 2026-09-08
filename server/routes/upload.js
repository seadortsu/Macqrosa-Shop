import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { authenticateAdmin } from '../middleware/auth.js';
import logger from '../logger.js';

const router = Router();

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for multer — files stream directly to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Admin: Upload product image to Cloudinary
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(503).json({ error: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.' });
    }

    // Upload buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'macqrosa/products',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit', quality: 'auto:best', format: 'webp' }
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    logger.error('Cloudinary upload error', { error: err.message });
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
