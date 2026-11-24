const { Produto, Carrinho, ItemCarrinho } = require('../model/associations.js');

const QUANTIDADE_MAXIMA = 99;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---- validações ----
function validarUuid(id) {
    return typeof id === 'string' && UUID_REGEX.test(id) ? id : null;
}

function validarInteiroPositivo(valor) {
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function validarQuantidade(valor) {
    const n = validarInteiroPositivo(valor);
    return n && n <= QUANTIDADE_MAXIMA ? n : null;
}

async function montarCarrinho(id) {
    const carrinho = await Carrinho.findByPk(id, {
        include: [{ model: ItemCarrinho, as: 'itens', include: [{ model: Produto, as: 'produto' }] }],
        order: [[{ model: ItemCarrinho, as: 'itens' }, 'id', 'ASC']]
    });
    if (!carrinho) return null;

    let totalCentavos = 0;
    let quantidadeTotal = 0;
    const itens = carrinho.itens.map((item) => {
        const precoCentavos = Math.round(Number(item.produto.preco) * 100);
        const subtotalCentavos = precoCentavos * item.quantidade;
        totalCentavos += subtotalCentavos;
        quantidadeTotal += item.quantidade;
        return {
            id: item.id,
            produtoId: item.produtoId,
            nome: item.produto.nome,
            imagem: item.produto.imagem,
            preco: precoCentavos / 100,
            quantidade: item.quantidade,
            subtotal: subtotalCentavos / 100
        };
    });

    return { id: carrinho.id, itens, quantidadeTotal, total: totalCentavos / 100 };
}

async function localizarCarrinho(req, res) {
    const id = validarUuid(req.params.id);
    if (!id) {
        res.status(422).json({ message: 'ID do carrinho inválido' });
        return null;
    }
    const existe = await Carrinho.findByPk(id, { attributes: ['id'] });
    if (!existe) {
        res.status(404).json({ message: 'Carrinho não encontrado' });
        return null;
    }
    return id;
}

module.exports = class CarrinhoController {
    static async create(req, res) {
        try {
            const novo = await Carrinho.create({});
            const carrinho = await montarCarrinho(novo.id);
            res.status(201).json({ message: 'Carrinho criado com sucesso', carrinho });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao criar o carrinho' });
        }
    }

    static async getById(req, res) {
        const id = validarUuid(req.params.id);
        if (!id) {
            return res.status(422).json({ message: 'ID do carrinho inválido' });
        }

        try {
            const carrinho = await montarCarrinho(id);
            if (!carrinho) {
                return res.status(404).json({ message: 'Carrinho não encontrado' });
            }
            res.status(200).json(carrinho);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao buscar o carrinho' });
        }
    }

    static async adicionar(req, res) {
        try {
            const id = await localizarCarrinho(req, res);
            if (!id) return;

            const { produtoId, quantidade = 1 } = req.body ?? {};
            const idProduto = validarInteiroPositivo(produtoId);
            const qtd = validarQuantidade(quantidade);
            if (!idProduto) {
                return res.status(422).json({ message: 'produtoId inválido' });
            }
            if (!qtd) {
                return res.status(422).json({ message: `A quantidade deve ser um número inteiro de 1 a ${QUANTIDADE_MAXIMA}` });
            }

            const produto = await Produto.findByPk(idProduto);
            if (!produto) {
                return res.status(404).json({ message: 'Produto não encontrado' });
            }

            const item = await ItemCarrinho.findOne({ where: { carrinhoId: id, produtoId: idProduto } });
            if (item) {
                const novaQtd = item.quantidade + qtd;
                if (novaQtd > QUANTIDADE_MAXIMA) {
                    return res.status(422).json({ message: `Quantidade máxima por produto: ${QUANTIDADE_MAXIMA}` });
                }
                await item.update({ quantidade: novaQtd });
            } else {
                await ItemCarrinho.create({ carrinhoId: id, produtoId: idProduto, quantidade: qtd });
            }

            res.status(200).json({ message: 'Produto adicionado ao carrinho', carrinho: await montarCarrinho(id) });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao adicionar o produto ao carrinho' });
        }
    }

    static async atualizarQuantidade(req, res) {
        try {
            const id = await localizarCarrinho(req, res);
            if (!id) return;

            const idProduto = validarInteiroPositivo(req.params.produtoId);
            if (!idProduto) {
                return res.status(422).json({ message: 'produtoId inválido' });
            }
            const qtd = validarQuantidade(req.body?.quantidade);
            if (!qtd) {
                return res.status(422).json({ message: `A quantidade deve ser um número inteiro de 1 a ${QUANTIDADE_MAXIMA}` });
            }

            const item = await ItemCarrinho.findOne({ where: { carrinhoId: id, produtoId: idProduto } });
            if (!item) {
                return res.status(404).json({ message: 'Item não encontrado no carrinho' });
            }
            await item.update({ quantidade: qtd });

            res.status(200).json({ message: 'Quantidade atualizada', carrinho: await montarCarrinho(id) });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao atualizar o item do carrinho' });
        }
    }

    static async removerItem(req, res) {
        try {
            const id = await localizarCarrinho(req, res);
            if (!id) return;

            const idProduto = validarInteiroPositivo(req.params.produtoId);
            if (!idProduto) {
                return res.status(422).json({ message: 'produtoId inválido' });
            }

            const removidos = await ItemCarrinho.destroy({ where: { carrinhoId: id, produtoId: idProduto } });
            if (!removidos) {
                return res.status(404).json({ message: 'Item não encontrado no carrinho' });
            }

            res.status(200).json({ message: 'Item removido do carrinho', carrinho: await montarCarrinho(id) });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao remover o item do carrinho' });
        }
    }

    static async limpar(req, res) {
        try {
            const id = await localizarCarrinho(req, res);
            if (!id) return;

            await ItemCarrinho.destroy({ where: { carrinhoId: id } });
            res.status(200).json({ message: 'Carrinho esvaziado', carrinho: await montarCarrinho(id) });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao esvaziar o carrinho' });
        }
    }
};