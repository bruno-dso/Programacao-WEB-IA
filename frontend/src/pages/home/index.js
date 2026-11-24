import { useEffect, useMemo, useState } from "react";
import CardProduto from "../../components/cardProduto";
import Carrinho from "../../components/carrinho";
import useProduto, { getErrorMessage } from "../../hooks/useProduto";
import useCarrinho from "../../hooks/useCarrinho";
import useVenda from "../../hooks/useVenda";

const CHAVE_CARRINHO = 'carrinhoId';

function lerCarrinhoId() {
    try {
        return localStorage.getItem(CHAVE_CARRINHO);
    } catch {
        return null;
    }
}

function salvarCarrinhoId(id) {
    try {
        localStorage.setItem(CHAVE_CARRINHO, id);
    } catch {

    }
}

let carregandoCarrinho = null;
function obterCarrinho(carrinhoApi) {
    if (!carregandoCarrinho) {
        carregandoCarrinho = (async () => {
            const id = lerCarrinhoId();
            if (id) {
                try {
                    return await carrinhoApi.getById(id);
                } catch (err) {
                    const status = err?.response?.status;
                    if (status !== 404 && status !== 422) throw err; // outro erro (API fora do ar etc.)
                }
            }
            const novo = await carrinhoApi.criar();
            salvarCarrinhoId(novo.id);
            return novo;
        })().finally(() => {
            carregandoCarrinho = null;
        });
    }
    return carregandoCarrinho;
}

const Home = () => {
    const produtoApi = useProduto();
    const carrinhoApi = useCarrinho();
    const vendaApi = useVenda();

    const [produtos, setProdutos] = useState([]);
    const [carrinho, setCarrinho] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [ocupado, setOcupado] = useState(false);
    const [erro, setErro] = useState('');
    const [busca, setBusca] = useState('');
    const [vendaConcluida, setVendaConcluida] = useState(null);

    useEffect(() => {
        let ativo = true;
        async function iniciar() {
            try {
                const [lista, carrinhoAtual] = await Promise.all([produtoApi.getAll(), obterCarrinho(carrinhoApi)]);
                if (!ativo) return;
                setProdutos(lista);
                setCarrinho(carrinhoAtual);
            } catch (err) {
                if (ativo) setErro(getErrorMessage(err, 'Erro ao carregar a loja'));
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        iniciar();
        return () => { ativo = false; };
    }, [produtoApi, carrinhoApi]);

    const produtosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return termo ? produtos.filter((p) => p.nome.toLowerCase().includes(termo)) : produtos;
    }, [produtos, busca]);

    async function executar(acao, mensagemPadrao) {
        setOcupado(true);
        setErro('');
        try {
            setCarrinho(await acao());
        } catch (err) {
            setErro(getErrorMessage(err, mensagemPadrao));
        } finally {
            setOcupado(false);
        }
    }

    function adicionar(produto) {
        setVendaConcluida(null);
        return executar(() => carrinhoApi.adicionar(carrinho.id, produto.id, 1), 'Erro ao adicionar ao carrinho');
    }

    function alterarQuantidade(produtoId, quantidade) {
        return executar(() => carrinhoApi.atualizarQuantidade(carrinho.id, produtoId, quantidade), 'Erro ao atualizar a quantidade');
    }

    function remover(produtoId) {
        return executar(() => carrinhoApi.removerItem(carrinho.id, produtoId), 'Erro ao remover o item');
    }

    function limpar() {
        if (!window.confirm('Deseja esvaziar o carrinho?')) {
            return;
        }
        return executar(() => carrinhoApi.limpar(carrinho.id), 'Erro ao esvaziar o carrinho');
    }

    async function finalizar({ cliente, formaPagamento }) {
        setOcupado(true);
        setErro('');
        try {
            const venda = await vendaApi.finalizar({ carrinhoId: carrinho.id, cliente, formaPagamento });
            setVendaConcluida(venda);
            setCarrinho({ ...carrinho, itens: [], quantidadeTotal: 0, total: 0 });
            return true;
        } catch (err) {
            setErro(getErrorMessage(err, 'Erro ao finalizar a venda'));
            return false;
        } finally {
            setOcupado(false);
        }
    }

    return (
        <div className="container py-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h1 className="fs-4 m-0">Loja</h1>
                <a href="#carrinho" className="btn btn-outline-dark d-lg-none">
                    Carrinho ({carrinho?.quantidadeTotal ?? 0})
                </a>
            </div>

            {erro && <div className="alert alert-danger" role="alert">{erro}</div>}

            <div className="row g-4">
                <div className="col-lg-8">
                    <input
                        className="form-control mb-3"
                        type="search"
                        placeholder="Buscar produto..."
                        aria-label="Buscar produto"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}/>

                    {carregando ? (
                        <p className="text-center text-muted">Carregando...</p>
                    ) : produtosFiltrados.length === 0 ? (
                        <p className="text-center text-muted">
                            {produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado para a busca'}
                        </p>
                    ) : (
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
                            {produtosFiltrados.map((produto) => (
                                <div className="col" key={produto.id}>
                                    <CardProduto
                                        produto={produto}
                                        onAdicionar={adicionar}
                                        desabilitado={ocupado || !carrinho}/>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-lg-4">
                    <div id="carrinho" className="sticky-top" style={{ top: 16 }}>
                        <Carrinho
                            carrinho={carrinho}
                            ocupado={ocupado}
                            vendaConcluida={vendaConcluida}
                            onAlterarQuantidade={alterarQuantidade}
                            onRemover={remover}
                            onLimpar={limpar}
                            onFinalizar={finalizar}
                            onNovaCompra={() => setVendaConcluida(null)}/>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;