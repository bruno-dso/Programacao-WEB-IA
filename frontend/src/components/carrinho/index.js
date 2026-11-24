import { useState } from "react";
import { urlImagem } from "../../utils/api";
import { moeda } from "../../utils/moeda";

const QUANTIDADE_MAXIMA = 99; // mesmo limite da API

const FORMAS_PAGAMENTO = [
    { valor: 'pix', rotulo: 'Pix' },
    { valor: 'cartao', rotulo: 'Cartão' },
    { valor: 'boleto', rotulo: 'Boleto' },
    { valor: 'dinheiro', rotulo: 'Dinheiro' }
];

const Carrinho = ({ carrinho, ocupado, vendaConcluida, onAlterarQuantidade, onRemover, onLimpar, onFinalizar, onNovaCompra }) => {
    const [finalizando, setFinalizando] = useState(false);
    const [cliente, setCliente] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('pix');
    const [erroForm, setErroForm] = useState('');

    const itens = carrinho?.itens ?? [];

    async function handleSubmit(e) {
        e.preventDefault();
        if (cliente.trim().length < 2) {
            setErroForm('Informe o nome do cliente (mínimo 2 caracteres)');
            return;
        }
        setErroForm('');
        const sucesso = await onFinalizar({ cliente: cliente.trim(), formaPagamento });
        if (sucesso) {
            setFinalizando(false);
            setCliente('');
            setFormaPagamento('pix');
        }
    }

    // Tela de sucesso após finalizar a venda
    if (vendaConcluida) {
        return (
            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="alert alert-success" role="alert">
                        <h2 className="fs-5">Compra finalizada!</h2>
                        <div>Venda nº <strong>{vendaConcluida.id}</strong></div>
                        <div>Cliente: {vendaConcluida.cliente}</div>
                        <div>Pagamento: {FORMAS_PAGAMENTO.find((f) => f.valor === vendaConcluida.formaPagamento)?.rotulo}</div>
                        <div>Total: <strong>{moeda(vendaConcluida.total)}</strong></div>
                    </div>
                    <ul className="list-group list-group-flush mb-3">
                        {vendaConcluida.itens.map((item) => (
                            <li key={item.id} className="list-group-item d-flex justify-content-between px-0">
                                <span>{item.quantidade}x {item.nome}</span>
                                <span>{moeda(item.subtotal)}</span>
                            </li>
                        ))}
                    </ul>
                    <button className="btn btn-primary w-100" type="button" onClick={onNovaCompra}>
                        Nova compra
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h2 className="fs-5 m-0">Carrinho</h2>
                <span className="badge bg-secondary">{carrinho?.quantidadeTotal ?? 0} item(ns)</span>
            </div>

            {itens.length === 0 ? (
                <div className="card-body text-center text-muted">Seu carrinho está vazio</div>
            ) : (
                <>
                    <ul className="list-group list-group-flush">
                        {itens.map((item) => (
                            <li key={item.produtoId} className="list-group-item">
                                <div className="d-flex gap-2">
                                    {item.imagem ? (
                                        <img src={urlImagem(item.imagem)} alt={item.nome} width={48} height={48} className="rounded" style={{ objectFit: 'cover' }}/>
                                    ) : (
                                        <div className="bg-light rounded" style={{ width: 48, height: 48 }}/>
                                    )}
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between">
                                            <strong>{item.nome}</strong>
                                            <button
                                                className="btn btn-sm btn-outline-danger py-0"
                                                type="button"
                                                aria-label={`Remover ${item.nome}`}
                                                onClick={() => onRemover(item.produtoId)}
                                                disabled={ocupado}>
                                                ×
                                            </button>
                                        </div>
                                        <small className="text-muted">{moeda(item.preco)} cada</small>
                                        <div className="d-flex justify-content-between align-items-center mt-1">
                                            <div className="btn-group btn-group-sm" role="group" aria-label={`Quantidade de ${item.nome}`}>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    aria-label="Diminuir quantidade"
                                                    onClick={() => onAlterarQuantidade(item.produtoId, item.quantidade - 1)}
                                                    disabled={ocupado || item.quantidade <= 1}>
                                                    −
                                                </button>
                                                <span className="btn btn-outline-secondary disabled" style={{ minWidth: 40 }}>{item.quantidade}</span>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    aria-label="Aumentar quantidade"
                                                    onClick={() => onAlterarQuantidade(item.produtoId, item.quantidade + 1)}
                                                    disabled={ocupado || item.quantidade >= QUANTIDADE_MAXIMA}>
                                                    +
                                                </button>
                                            </div>
                                            <strong>{moeda(item.subtotal)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="card-body border-top">
                        <div className="d-flex justify-content-between fs-5 mb-3">
                            <span>Total</span>
                            <strong>{moeda(carrinho.total)}</strong>
                        </div>

                        {finalizando ? (
                            <form onSubmit={handleSubmit}>
                                {erroForm && <div className="alert alert-danger py-2" role="alert">{erroForm}</div>}
                                <div className="mb-2">
                                    <label className="form-label" htmlFor="cliente">Nome do cliente</label>
                                    <input
                                        id="cliente"
                                        className="form-control"
                                        type="text"
                                        maxLength={120}
                                        value={cliente}
                                        onChange={(e) => { setCliente(e.target.value); setErroForm(''); }}
                                        placeholder="Seu nome"/>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="pagamento">Forma de pagamento</label>
                                    <select
                                        id="pagamento"
                                        className="form-select"
                                        value={formaPagamento}
                                        onChange={(e) => setFormaPagamento(e.target.value)}>
                                        {FORMAS_PAGAMENTO.map((f) => (
                                            <option key={f.valor} value={f.valor}>{f.rotulo}</option>
                                        ))}
                                    </select>
                                </div>
                                <button className="btn btn-success w-100 mb-2" type="submit" disabled={ocupado}>
                                    {ocupado ? 'Finalizando...' : `Confirmar venda • ${moeda(carrinho.total)}`}
                                </button>
                                <button className="btn btn-link w-100" type="button" onClick={() => setFinalizando(false)} disabled={ocupado}>
                                    Voltar ao carrinho
                                </button>
                            </form>
                        ) : (
                            <>
                                <button className="btn btn-success w-100 mb-2" type="button" onClick={() => setFinalizando(true)} disabled={ocupado}>
                                    Finalizar compra
                                </button>
                                <button className="btn btn-outline-secondary w-100" type="button" onClick={onLimpar} disabled={ocupado}>
                                    Esvaziar carrinho
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default Carrinho;