const db = require('../db/conn.js');
const { Produto, Carrinho, ItemCarrinho, Venda, ItemVenda } = require('../model/associations.js');

const FORMAS_PAGAMENTO = ['pix', 'cartao', 'boleto', 'dinheiro'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOTAL_MAXIMO_CENTAVOS = 1e12 - 1; // limite da coluna DECIMAL(12,2)

class ErroNegocio extends Error {
    constructor(message, status = 422) {
        super(message);
        this.status = status;
    }
}

// ---- validações ----
function validarId(id) {
    const n = Number(id);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function validarCliente(cliente) {
    return typeof cliente === 'string' && cliente.trim().length >= 2 && cliente.trim().length <= 120;
}

function formatarVenda(venda) {
    return {
        id: venda.id,
        cliente: venda.cliente,
        formaPagamento: venda.formaPagamento,
        total: Number(venda.total),
        createdAt: venda.createdAt,
        itens: (venda.itens ?? []).map((item) => ({
            id: item.id,
            produtoId: item.produtoId,
            nome: item.nome,
            precoUnitario: Number(item.precoUnitario),
            quantidade: item.quantidade,
            subtotal: Number(item.subtotal)
        }))
    };
}

const INCLUIR_ITENS = [{ model: ItemVenda, as: 'itens' }];

module.exports = class VendaController {
    static async finalizar(req, res) {
        const { carrinhoId, cliente, formaPagamento } = req.body ?? {};

        if (typeof carrinhoId !== 'string' || !UUID_REGEX.test(carrinhoId)) {
            return res.status(422).json({ message: 'ID do carrinho inválido' });
        }
        if (!validarCliente(cliente)) {
            return res.status(422).json({ message: 'Informe o nome do cliente (mínimo 2 caracteres)' });
        }
        if (!FORMAS_PAGAMENTO.includes(formaPagamento)) {
            return res.status(422).json({ message: `Forma de pagamento inválida. Use: ${FORMAS_PAGAMENTO.join(', ')}` });
        }

        try {
            const carrinho = await Carrinho.findByPk(carrinhoId, { attributes: ['id'] });
            if (!carrinho) {
                return res.status(404).json({ message: 'Carrinho não encontrado' });
            }

            const vendaId = await db.transaction(async (t) => {
                const itens = await ItemCarrinho.findAll({
                    where: { carrinhoId },
                    include: [{ model: Produto, as: 'produto' }],
                    transaction: t
                });
                if (itens.length === 0) {
                    throw new ErroNegocio('O carrinho está vazio');
                }

                let totalCentavos = 0;
                const itensVenda = itens.map((item) => {
                    const precoCentavos = Math.round(Number(item.produto.preco) * 100);
                    const subtotalCentavos = precoCentavos * item.quantidade;
                    totalCentavos += subtotalCentavos;
                    return {
                        produtoId: item.produtoId,
                        nome: item.produto.nome,
                        precoUnitario: precoCentavos / 100,
                        quantidade: item.quantidade,
                        subtotal: subtotalCentavos / 100
                    };
                });
                if (totalCentavos > TOTAL_MAXIMO_CENTAVOS) {
                    throw new ErroNegocio('O valor total da venda excede o limite permitido');
                }

                const venda = await Venda.create(
                    { cliente: cliente.trim(), formaPagamento, total: totalCentavos / 100 },
                    { transaction: t }
                );
                await ItemVenda.bulkCreate(
                    itensVenda.map((i) => ({ ...i, vendaId: venda.id })),
                    { transaction: t }
                );
                await ItemCarrinho.destroy({ where: { carrinhoId }, transaction: t });

                return venda.id;
            });

            const venda = await Venda.findByPk(vendaId, { include: INCLUIR_ITENS });
            res.status(201).json({ message: 'Venda finalizada com sucesso', venda: formatarVenda(venda) });
        } catch (err) {
            if (err instanceof ErroNegocio) {
                return res.status(err.status).json({ message: err.message });
            }
            console.error(err);
            res.status(500).json({ message: 'Erro ao finalizar a venda' });
        }
    }

    static async getAll(req, res) {
        try {
            const vendas = await Venda.findAll({
                include: INCLUIR_ITENS,
                order: [['createdAt', 'DESC'], ['id', 'DESC']]
            });
            res.status(200).json(vendas.map(formatarVenda));
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao buscar as vendas' });
        }
    }

    static async getById(req, res) {
        const id = validarId(req.params.id);
        if (!id) {
            return res.status(422).json({ message: 'ID inválido' });
        }

        try {
            const venda = await Venda.findByPk(id, { include: INCLUIR_ITENS });
            if (!venda) {
                return res.status(404).json({ message: 'Venda não encontrada' });
            }
            res.status(200).json(formatarVenda(venda));
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Erro ao buscar a venda' });
        }
    }
};