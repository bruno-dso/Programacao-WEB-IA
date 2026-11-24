const router = require("express").Router();
const CarrinhoController = require("../controller/CarrinhoController.js");

router.post('/create', CarrinhoController.create);
router.get('/getById/:id', CarrinhoController.getById);
router.post('/:id/adicionar', CarrinhoController.adicionar);
router.patch('/:id/item/:produtoId', CarrinhoController.atualizarQuantidade);
router.delete('/:id/item/:produtoId', CarrinhoController.removerItem);
router.delete('/:id/limpar', CarrinhoController.limpar);

module.exports = router;