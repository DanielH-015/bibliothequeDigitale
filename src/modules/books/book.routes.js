import { Router } from '../../utils/router.js';
import { bookService } from './book.service.js';
import { verify, requireAdmin } from '../../middlewares/auth.middleware.js';
import { validateCreate, validateUpdate } from '../../middlewares/book.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();

router.get('/', verify, async () => {
  return bookService.getAll();
});

router.get('/:id', verify, async (req) => {
  return bookService.getById(parseInt(req.params.id));
});

// Routes of modification accessible only to Admin
router.post('/', verify, requireAdmin, upload.single('coverImage'), validateCreate, async (req) => {
  const payload = req.body;
  if (req.file) {
    payload.coverImage = `/uploads/${req.file.filename}`;
  }
  return bookService.create(payload);
});

router.put('/:id', verify, requireAdmin, upload.single('coverImage'), validateUpdate, async (req) => {
  const payload = req.body;
  if (req.file) {
    payload.coverImage = `/uploads/${req.file.filename}`;
  }
  return bookService.update(parseInt(req.params.id), payload);
});

router.delete('/:id', verify, requireAdmin, async (req) => {
  return bookService.delete(parseInt(req.params.id));
});

export const bookRoutes = router;
