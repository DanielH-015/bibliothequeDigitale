import { Router } from '../../utils/router.js';
import { userService } from './user.service.js';
import { verify, requireAdmin } from '../../middlewares/auth.middleware.js';
import { validateCreate, validateUpdate } from '../../middlewares/user.middleware.js';

const router = Router();

router.use(verify);
router.use(requireAdmin);

router.get('/', async () => {
  return userService.getAll();
});

router.post('/', validateCreate, async (req) => {
  const payload = req.body;
  return userService.create(payload);
});

router.get('/:id', async (req) => {
  return userService.getById(parseInt(req.params.id));
});

router.put('/:id', validateUpdate, async (req) => {
  const payload = req.body;
  return userService.update(parseInt(req.params.id), payload);
});

router.delete('/:id', async (req) => {
  return userService.delete(parseInt(req.params.id));
});

export const userRoutes = router;
