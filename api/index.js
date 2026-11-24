const path = require('path');
const express = require('express');
const cors = require('cors');
const conn = require('./db/conn.js');
const produtoRoutes = require('./router/ProdutoRoutes.js');
const carrinhoRoutes = require('./router/CarrinhoRoutes.js');
const vendaRoutes = require('./router/VendaRoutes.js');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/produto', produtoRoutes);
app.use('/carrinho', carrinhoRoutes);
app.use('/venda', vendaRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'JSON inválido no corpo da requisição' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

async function start() {
    try {
        await conn.authenticate();
        console.log('Conexão com o banco realizada com sucesso');
        await conn.sync({alter: true});
        app.listen(port, () => console.log(`API rodando na porta ${port}`));
    } catch (err) {
        console.error('Erro ao conectar/sincronizar com o banco:', err.message);
        process.exit(1);
    }
}

start();
