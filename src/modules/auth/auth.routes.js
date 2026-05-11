import { Router } from '../../utils/router.js';
import { authService } from './auth.service.js';

const router = Router();

// POST route : http://localhost:5000/api/auth/login
router.post('/login', async (req) => {
  const payload = req.body;
  return authService.login(payload);
});

// POST route : http://localhost:5000/api/auth/register
router.post('/register', async (req) => {
  const payload = req.body;
  return authService.register(payload);
});

// POST route : http://localhost:5000/api/auth/verify-email
router.post('/verify-email', async (req) => {
  const { token } = req.body;
  return authService.verifyEmail(token);
});

// POST route : http://localhost:5000/api/auth/forgot-password
router.post('/forgot-password', async (req) => {
  const { email } = req.body;
  return authService.forgotPassword(email);
});

// POST route : http://localhost:5000/api/auth/reset-password
router.post('/reset-password', async (req) => {
  const payload = req.body;
  return authService.resetPassword(payload);
});

// GET route : Triggered when the user clicks the link in their email
router.get('/verify-email-link', async (req) => {
  const token = req.query.token;
  // We pass the entire 'req' object to the service so it can handle the redirection
  return authService.verifyEmailLink(token, req);
});

// GET route : Triggered when the user clicks the RESET link in their email
router.get('/reset-password-link', async (req) => {
  const token = req.query.token;
  // We force the phone's browser to open the Flutter app and pass the token
  req.res.redirect(`digitallibrary://auth/reset?token=${token}`);
  return;
});



export const authRoutes = router;
