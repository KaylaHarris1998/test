import express from 'express';
import { 
  Register, 
  Login, 
  Logout, 
  getUser, 
  getAllUser, 
  Update, 
  ChangePassword, 
  ForgotPassword, 
  ResetPassword,
  saveAgencyKey,
  saveUserType,
  getUserType,
  addUser
} from '../controllers/usercontroller.js';
import { verifyToken, requireManager, requireAdmin } from '../middleware/auth.js';

const router = express.Router();


router.post('/register', Register);
router.post('/login', Login);
router.post('/logout', Logout);
router.post('/forgot-password', ForgotPassword);
router.post('/reset-password', ResetPassword);


router.get('/profile', verifyToken, getUser);
router.put('/profile', verifyToken, Update);
router.put('/change-password', verifyToken, ChangePassword);
router.post('/agency-key', verifyToken, saveAgencyKey);
router.post('/user-type', verifyToken, saveUserType);
router.get('/user-type', verifyToken, getUserType);


router.get('/all', verifyToken, requireManager, getAllUser);
router.post('/add', verifyToken, requireManager, addUser);


router.get('/admin/:id', verifyToken, requireAdmin, getUser);

export default router; 