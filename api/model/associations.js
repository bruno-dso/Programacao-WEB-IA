const Produto = require('./Produto.js');
const Carrinho = require('./Carrinho.js');
const ItemCarrinho = require('./ItemCarrinho.js');
const Venda = require('./Venda.js');
const ItemVenda = require('./ItemVenda.js');

Carrinho.hasMany(ItemCarrinho, { as: 'itens', foreignKey: 'carrinhoId', onDelete: 'CASCADE' });
ItemCarrinho.belongsTo(Carrinho, { foreignKey: 'carrinhoId' });

Produto.hasMany(ItemCarrinho, { foreignKey: 'produtoId', onDelete: 'CASCADE' });
ItemCarrinho.belongsTo(Produto, { as: 'produto', foreignKey: 'produtoId', onDelete: 'CASCADE' });

Venda.hasMany(ItemVenda, { as: 'itens', foreignKey: 'vendaId', onDelete: 'CASCADE' });
ItemVenda.belongsTo(Venda, { foreignKey: 'vendaId' });

Produto.hasMany(ItemVenda, { foreignKey: 'produtoId', onDelete: 'SET NULL' });
ItemVenda.belongsTo(Produto, { foreignKey: 'produtoId', onDelete: 'SET NULL' });

module.exports = { Produto, Carrinho, ItemCarrinho, Venda, ItemVenda };