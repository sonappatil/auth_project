const express = require('express');
const authController = require('../controllers/authController');
const { identifier } = require('../middlewares/identification');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', identifier ,authController.signout);

router.patch('/send-verification-code', identifier, authController.sendVerificationCode);
router.patch('/verify-verification-code', identifier, authController.verifyVerificationCode);
router.patch('/change-password', identifier, authController.chanegePassword);
router.patch('/send-forgetpassword-code', authController.sendForgetPasswordCode);
router.patch('/verify-forgetpassword-code', authController.verifyForgetPasswordCode);






module.exports = router;