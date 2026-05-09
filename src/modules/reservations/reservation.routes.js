import { Router } from '../../utils/router.js';
import { reservationService } from './reservation.service.js';
import { verify, requireAdmin, requireLibrarianOrAdmin } from '../../middlewares/auth.middleware.js';
import { validateCreate } from '../../middlewares/reservation.middleware.js';

const router = Router();

router.use(verify);

// A student can create a reservation for a book copy that is currently available
router.post('/', validateCreate, async (req) => {
  const payload = req.body;
  const userId = req.user.id;
  return reservationService.create(userId, payload);
});

// A student (or admin) can view their reservation history
router.get('/student/:studentId', async (req) => {
  return reservationService.getByStudentId(parseInt(req.params.studentId));
});

// A student (or admin) can cancel a pending reservation
router.delete('/:id', async (req) => {
  return reservationService.cancel(parseInt(req.params.id));
});

// Restricted routes for Admin and Librarian to manage reservations
router.get('/', requireAdmin, async () => {
  return reservationService.getAll();
});

router.put('/:id/validate', requireLibrarianOrAdmin, async (req) => {
  const payload = req.body;
  return reservationService.validate(parseInt(req.params.id), payload);
});

export const reservationRoutes = router;
