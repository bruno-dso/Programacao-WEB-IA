const { DataTypes } = require('sequelize');
const db = require('../db/conn.js');

const ItemCarrinho = db.define('ItemCarrinho', {
    carrinhoId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    produtoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
});

module.exports = ItemCarrinho;