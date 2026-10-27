const router = require('express').Router();
const {
  register,
  login,
  me,
  verifyEmailOtp,
  verifyEmail,
  resendVerificationOtp,
  resendVerification,
  forgotPassword,
  submitRecoveryRequest,
  resetPassword,
  changePassword,
  getDemoAccounts,
  getSmtpStatus,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyEmailOtp);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendVerificationOtp);
router.post('/resend-verification-otp', resendVerificationOtp);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/recovery-request', submitRecoveryRequest);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.get('/smtp-status', protect, getSmtpStatus);
router.get('/demo-accounts', getDemoAccounts);
router.get('/me', protect, me);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
