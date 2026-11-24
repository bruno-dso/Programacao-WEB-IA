const { DataTypes } = require('sequelize');
const db = require('../db/conn.js');

const Venda = db.define('Venda', {
    cliente: {
        type: DataTypes.STRING,
        allowNull: false
    },
    formaPagamento: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    }
});

module.exports = Venda;