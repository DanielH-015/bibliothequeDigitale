import { Router } from '../../utils/router.js';
import { authService } from './auth.service.js';

const router = Router();

// POST route : http://localhost:5000/api/auth/login
router.post('/login', async (req) => {
  const payload = req.body;
  return authService.login(payload);
});

export const authRoutes = router;
