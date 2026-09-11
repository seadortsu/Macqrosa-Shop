import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateAdmin } from '../middleware/auth.js';
import logger from '../logger.js';
import { query } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Ensure local upload directory exists if not serverless
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    // Ignore error in serverless / read-only filesystem
  }
}

// Multer storage: Use memoryStorage for Cloudinary/Serverless, or diskStorage for local dev
const storage = hasCloudinary || Boolean(process.env.VERCEL)
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /api/upload
 * Upload a file and save metadata to the media table
 */
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    let filePath = '';
    const fileName = req.file.originalname || `upload-${Date.now()}`;

    // 1. Cloudinary upload if configured
    if (hasCloudinary && req.file.buffer) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'macqrosa-shop', resource_type: 'image' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const uploadResult = await uploadPromise;
      filePath = uploadResult.secure_url;
    } else if (req.file.filename) {
      // 2. Local disk upload
      filePath = `/uploads/${req.file.filename}`;
    } else if (req.file.buffer) {
      // 3. Fallback: Base64 data URI if no Cloudinary and on serverless
      filePath = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    
    // Save to media table
    const result = await query(`
      INSERT INTO media (file_name, file_path, mime_type, size, alt_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, file_path, file_name, uploaded_at
    `, [fileName, filePath, req.file.mimetype, req.file.size, req.body.alt_text || '']);

    logger.info(`Image uploaded successfully: ${fileName}`);

    res.json({
      success: true,
      url: filePath,
      media: result.rows ? result.rows[0] : null
    });
  } catch (err) {
    logger.error('Upload error', { error: err.message });
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * GET /api/upload/media
 * Get all media files for the library
 */
router.get('/media', authenticateAdmin, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM media ORDER BY uploaded_at DESC');
    res.json(rows);
  } catch (err) {
    logger.error('Error fetching media', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch media library' });
  }
});

/**
 * DELETE /api/upload/media/:id
 * Delete a media file from disk/Cloudinary and DB
 */
router.delete('/media/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query('SELECT file_path FROM media WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const fileUrl = rows[0].file_path;
    
    // If local file, unlink
    if (fileUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '../../public', fileUrl);
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch (e) {}
      }
    }
    
    await query('DELETE FROM media WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting media', { error: err.message });
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
