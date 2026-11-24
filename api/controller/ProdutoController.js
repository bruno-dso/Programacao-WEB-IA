const Produto = require('../model/Produto.js');
const { removerArquivo } = require('../middleware/upload.js');

// ---- validações ----
function validarId(id) {
    const n = Number(id);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function validarNome(nome) {
    return typeof nome === 'string' && nome.trim().length > 0 && nome.trim().length <= 255;
}

function validarPreco(preco) {
    if (preco === null || preco === undefined || preco === '') return false;
    const n = Number(preco);
    return Number.isFinite(n) && n >= 0 && n < 100000000; // DECIMAL(10,2)
}

module.exports = class ProdutoController {
    static async create(req, res) {
        const { nome, preco } = req.body ?? {};
        const imagem = req.file?.filename ?? null;

        if (!validarNome(nome)) {
            removerArquivo(imagem);
            return res.status(422).json({ message: 'O nome é obrigatório' });
        }
        if (!validarPreco(preco)) {
            removerArquivo(imagem);
            return res.status(422).json({ message: 'O preço é obrigatório e deve ser um número maior ou igual a zero' });
        }

        try {
            const produto = await Produto.create({ nome: nome.trim(), preco: Number(preco), imagem });
            res.status(201).json({ message: 'Produto criado com sucesso', produto });
        } catch (err) {
            removerArquivo(imagem);
            console.error(err);
            res.status(500).json({ message: 'Erro ao criar o produto' });
        }
    }

    static async getAll(req, res) {
        try {
            const produtos = await Produto.findAll();
            res.status(200).json(produtos);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao buscar os produtos' });
        }
    }

    static async getById(req, res) {
        const id = validarId(req.params.id);
        if (!id) {
            return res.status(422).json({ message: 'ID inválido' });
        }

        try {
            const produto = await Produto.findByPk(id);
            if (!produto) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }
            res.status(200).json(produto);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao buscar o produto' });
        }
    }

    static async update(req, res) {
        const novaImagem = req.file?.filename ?? null;
        const id = validarId(req.params.id);
        if (!id) {
            removerArquivo(novaImagem);
            return res.status(422).json({ message: 'ID inválido' });
        }

        const { nome, preco, removerImagem } = req.body ?? {};
        const dados = {};
        const rejeitar = (message) => {
            removerArquivo(novaImagem);
            return res.status(422).json({ message });
        };

        if (nome !== undefined) {
            if (!validarNome(nome)) return rejeitar('O nome não pode ser vazio');
            dados.nome = nome.trim();
        }
        if (preco !== undefined) {
            if (!validarPreco(preco)) return rejeitar('O preço deve ser um número maior ou igual a zero');
            dados.preco = Number(preco);
        }
        if (novaImagem) {
            dados.imagem = novaImagem;
        } else if (removerImagem === true || removerImagem === 'true') {
            dados.imagem = null;
        }
        if (Object.keys(dados).length === 0) {
            return rejeitar('Informe nome, preco e/ou imagem para atualizar');
        }

        try {
            const produto = await Produto.findByPk(id);
            if (!produto) {
                removerArquivo(novaImagem);
                return res.status(404).json({ message: 'Produto não encontrado' });
            }
            const imagemAntiga = produto.imagem;
            await produto.update(dados);
            if ('imagem' in dados && imagemAntiga && imagemAntiga !== dados.imagem) {
                removerArquivo(imagemAntiga);
            }
            res.status(200).json({ message: 'Produto atualizado com sucesso', produto });
        } catch (err) {
            removerArquivo(novaImagem);
            console.error(err);
            res.status(500).json({ message: 'Erro ao atualizar o produto' });
        }
    }

    static async delete(req, res) {
        const id = validarId(req.params.id);
        if (!id) {
            return res.status(422).json({ message: 'ID inválido' });
        }

        try {
            const produto = await Produto.findByPk(id);
            if (!produto) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }
            const imagem = produto.imagem;
            await produto.destroy();
            removerArquivo(imagem);
            res.status(200).json({ message: 'Produto deletado com sucesso' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao deletar o produto' });
        }
    }
};