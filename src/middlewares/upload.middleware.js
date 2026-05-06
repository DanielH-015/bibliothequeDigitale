import multer from 'multer';
import path from 'path';

class UploadMiddleware {
  constructor() {
    // Configuration of Multer for file storage and filtering
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });

    // Filter to allow only image files 
    const fileFilter = (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images are allowed.'), false);
      }
    };

    this.upload = multer({ storage: storage, fileFilter: fileFilter });
  }
}

export const uploadMiddleware = new UploadMiddleware();
