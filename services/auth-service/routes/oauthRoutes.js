const express = require('express');
const router  = express.Router();

router.get('/github', (_, res) => res.json({ message: 'Coming soon — GitHub OAuth' }));
module.exports = router;