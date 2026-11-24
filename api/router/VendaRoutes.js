const router = require("express").Router();
const VendaController = require("../controller/VendaController.js");

router.post('/finalizar', VendaController.finalizar);
router.get('/getAll', VendaController.getAll);
router.get('/getById/:id', VendaController.getById);

module.exports = router;