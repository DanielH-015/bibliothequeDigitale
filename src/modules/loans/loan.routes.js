import { Router } from '../../utils/router.js';
import { loanService } from './loan.service.js';
import { verify, requireAdmin, requireLibrarianOrAdmin } from '../../middlewares/auth.middleware.js';
import { validateCreate } from '../../middlewares/loan.middleware.js';

const router = Router();

// Only authenticated users can access these routes (Admin, Librarian, Student)
router.use(verify);

// Routes for Admin and Librarian to manage loans
router.get('/', requireLibrarianOrAdmin, async () => {
  return loanService.getAll();
});

router.post('/', requireLibrarianOrAdmin, validateCreate, async (req) => {
  const payload = req.body;
  return loanService.create(payload);
});

router.put('/:id/return', requireLibrarianOrAdmin, async (req) => {
  return loanService.returnLoan(parseInt(req.params.id));
});

router.delete('/:id', requireAdmin, async (req) => {
  return loanService.cancel(parseInt(req.params.id));
});

router.post('/:id/notify', requireLibrarianOrAdmin, async (req) => {
  return loanService.notifyOverdue(parseInt(req.params.id));
});

// Route: A student (or an admin) can view a student's loan history
router.get('/student/:studentId', async (req) => {
  return loanService.getByStudentId(parseInt(req.params.studentId));
});

export const loanRoutes = router;
