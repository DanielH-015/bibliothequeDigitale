import { Router } from '../../utils/router.js';
import { userService } from './user.service.js';
import { verify, requireAdmin } from '../../middlewares/auth.middleware.js';
import { validateCreate, validateUpdate } from '../../middlewares/user.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();

router.use(verify);

router.get('/', requireAdmin, async () => {
  return userService.getAll();
});

router.post('/', requireAdmin, validateCreate, async (req) => {
  const payload = req.body;
  return userService.create(payload);
});

router.get('/:id', async (req, res) => {
  // Allow if admin OR if asking for own profile
  if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  return userService.getById(parseInt(req.params.id));
});

router.put('/:id', upload.single('profileImage'), validateUpdate, async (req, res) => {
  // Allow if admin OR if editing own profile
  if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  const payload = req.body;
  
  // A non-admin cannot change their own role or valid status
  if (req.user.role !== 'ADMIN') {
    delete payload.role;
    delete payload.isValid;
  }

  if (req.file) {
    payload.profileImage = req.file.path.replace(/\\/g, '/');
  }
  
  if (payload.isValid === 'true') payload.isValid = true;
  if (payload.isValid === 'false') payload.isValid = false;

  return userService.update(parseInt(req.params.id), payload);
});

router.delete('/:id', requireAdmin, async (req) => {
  return userService.delete(parseInt(req.params.id));
});

export const userRoutes = router;
