import { Router } from '../../utils/router.js';
import { studentService } from './student.service.js';
import { verify, requireAdmin, requireLibrarianOrAdmin } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { validateCreate, validateUpdate } from '../../middlewares/student.middleware.js';

const router = Router();

router.use(verify);

router.get('/', requireLibrarianOrAdmin, async () => {
  return studentService.getAll();
});

router.post('/', requireAdmin, validateCreate, async (req) => {
  const payload = req.body;
  return studentService.create(payload);
});

router.get('/scan/:qrCode', async (req) => {
  return studentService.getByQrCode(req.params.qrCode);
});

router.get('/:id', async (req) => {
  return studentService.getById(parseInt(req.params.id));
});

router.put('/:id', validateUpdate, async (req) => {
  const payload = req.body;
  return studentService.update(parseInt(req.params.id), payload);
});

router.post('/:id/photo', upload.single('photo'), async (req) => {
  if (!req.file) throw new Error("No image provided.");
  const photoPath = req.file.path.replace(/\\/g, '/');
  await studentService.uploadPhoto(parseInt(req.params.id), photoPath);
  return { message: "Photo uploaded successfully.", photoUrl: photoPath };
});

router.delete('/:id', requireAdmin, async (req) => {
  return studentService.delete(parseInt(req.params.id));
});

export const studentRoutes = router;
