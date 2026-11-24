const { DataTypes } = require('sequelize');
const db = require('../db/conn.js');

const Carrinho = db.define('Carrinho', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    }
});

module.exports = Carrinho;