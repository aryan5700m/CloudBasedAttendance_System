import { Router } from 'express';
import { signup, login, getStudents, markAttendance } from '../controllers/teacher.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/students', authenticate('teacher'), getStudents);
router.post('/mark-attendance', authenticate('teacher'), markAttendance);

export default router;
