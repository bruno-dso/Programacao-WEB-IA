import { useCallback, useEffect, useState } from "react";
import InputGroup from "../../components/inputGroup";
import useProduto, { getErrorMessage } from "../../hooks/useProduto";

const PRODUTO_VAZIO = { nome: '', preco: '' };

const Produtos = () => {
    const { getAll, create, update, remove } = useProduto();

    const [produto, setProduto] = useState(PRODUTO_VAZIO);
    const [listaProdutos, setListaProdutos] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    const carregarProdutos = useCallback(async () => {
        try {
            setListaProdutos(await getAll());
            setErro('');
        } catch (err) {
            setErro(getErrorMessage(err, 'Erro ao carregar os produtos'));
        } finally {
            setCarregando(false);
        }
    }, [getAll]);

    useEffect(() => {
        carregarProdutos();
    }, [carregarProdutos]);

    function validateProduto(produto) {
        if (!produto.nome || !produto.nome.trim()) {
            alert("O campo nome é obrigatório");
            return false;
        }
        if (produto.preco === '' || produto.preco === undefined) {
            alert("O campo preço é obrigatório");
            return false;
        }
        if (Number(produto.preco) < 0) {
            alert("O preço não pode ser negativo");
            return false;
        }
        return true;
    }

    function handleChange(e) {
        setProduto({ ...produto, [e.target.name]: e.target.value });
    }

    function cancelarEdicao() {
        setEditandoId(null);
        setProduto(PRODUTO_VAZIO);
    }

    function iniciarEdicao(item) {
        setEditandoId(item.id);
        setProduto({ nome: item.nome, preco: String(item.preco) });
        setErro('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateProduto(produto)) {
            return;
        }

        const dados = { nome: produto.nome.trim(), preco: Number(produto.preco) };
        setSalvando(true);
        try {
            if (editandoId) {
                await update(editandoId, dados);
            } else {
                await create(dados);
            }
            cancelarEdicao();
            await carregarProdutos();
        } catch (err) {
            setErro(getErrorMessage(err, 'Erro ao salvar o produto'));
        } finally {
            setSalvando(false);
        }
    }

    async function handleDelete(item) {
        if (!window.confirm(`Deseja realmente excluir "${item.nome}"?`)) {
            return;
        }
        try {
            await remove(item.id);
            if (editandoId === item.id) {
                cancelarEdicao();
            }
            await carregarProdutos();
        } catch (err) {
            setErro(getErrorMessage(err, 'Erro ao excluir o produto'));
        }
    }

    return (
        <div className="container">
            <h1 className="text-center fs-4">Produtos</h1>

            {erro && <div className="alert alert-danger" role="alert">{erro}</div>}

            <div>
                <form onSubmit={handleSubmit}>
                    <InputGroup
                        label="Nome"
                        onChange={handleChange}
                        type="text"
                        placeholder="Nome do Produto"
                        name="nome"
                        value={produto.nome}/>
                    <InputGroup
                        label="Preço"
                        onChange={handleChange}
                        type="number"
                        placeholder="Preço do Produto"
                        name="preco"
                        min="0"
                        step="0.01"
                        value={produto.preco}/>

                    <button className="btn btn-primary" type="submit" disabled={salvando}>
                        {editandoId ? 'Atualizar' : 'Salvar'}
                    </button>
                    {editandoId && (
                        <button className="btn btn-secondary ms-2" type="button" onClick={cancelarEdicao}>
                            Cancelar
                        </button>
                    )}
                </form>
            </div>

            <table className=" table table-striped mt-3">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Preço</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {carregando ? (
                        <tr>
                            <td colSpan={3} className="text-center">Carregando...</td>
                        </tr>
                    ) : listaProdutos.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="text-center">Nenhum produto encontrado</td>
                        </tr>
                    ) : (
                        listaProdutos.map((item) => (
                            <tr key={item.id}>
                                <td>{item.nome}</td>
                                <td>R$ {Number(item.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => iniciarEdicao(item)}>
                                        Editar
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item)}>
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default Produtos;
