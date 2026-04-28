const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/authController');
const { jwtMiddleware } = require('../middleware/jwtMiddleware');

router.post('/register', auth.register);
router.post('/login',    auth.login);
router.post('/refresh',  auth.refresh);

router.post('/logout', jwtMiddleware, auth.logout);
router.get('/me',      jwtMiddleware, auth.me);

module.exports = router;