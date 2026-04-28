const express = require('express');
const router  = express.Router();
const oauth   = require('../controllers/oauthController');

router.get('/github', oauth.redirectToGitHub);

router.get('/github/callback', oauth.handleGitHubCallback);

module.exports = router;