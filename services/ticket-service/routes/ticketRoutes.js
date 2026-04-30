const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ticketController');

router.post('/validate',  ctrl.validateTicket); 
router.get('/my',         ctrl.getMyTickets);    
router.get('/:qrCode',    ctrl.getTicketDetail);  

module.exports = router;