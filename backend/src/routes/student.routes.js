import { Router } from 'express';
import { signup, login, logout, getAttendance } from '../controllers/student.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticate('student'), logout);
router.get('/attendance', authenticate('student'), getAttendance);

export default router;
