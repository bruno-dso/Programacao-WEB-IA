import { useCallback, useEffect, useRef, useState } from "react";
import InputGroup from "../../components/inputGroup";
import useProduto, { getErrorMessage } from "../../hooks/useProduto";
import { urlImagem } from "../../utils/api";

const PRODUTO_VAZIO = { nome: '', preco: '' };
const TIPOS_ACEITOS = ['image/jpeg', 'image/png'];
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB (mesmo limite da API)

const Produtos = () => {
    const { getAll, create, update, remove } = useProduto();

    const [produto, setProduto] = useState(PRODUTO_VAZIO);
    const [listaProdutos, setListaProdutos] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');
    const [arquivo, setArquivo] = useState(null);          
    const [preview, setPreview] = useState(null);          
    const [imagemAtual, setImagemAtual] = useState(null);  
    const [removerImagem, setRemoverImagem] = useState(false);
    const inputArquivo = useRef(null);

    useEffect(() => {
        if (!arquivo) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(arquivo);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [arquivo]);

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

    function limparImagem() {
        setArquivo(null);
        if (inputArquivo.current) inputArquivo.current.value = '';
    }

    function handleArquivo(e) {
        const file = e.target.files[0];
        if (!file) {
            setArquivo(null);
            return;
        }
        
        if (!TIPOS_ACEITOS.includes(file.type)) {
            alert("Formato inválido. Envie apenas imagens .jpeg ou .png");
            limparImagem();
            return;
        }
        if (file.size > TAMANHO_MAXIMO) {
            alert("A imagem deve ter no máximo 2 MB");
            limparImagem();
            return;
        }
        setArquivo(file);
        setRemoverImagem(false);
    }

    function cancelarEdicao() {
        setEditandoId(null);
        setProduto(PRODUTO_VAZIO);
        setImagemAtual(null);
        setRemoverImagem(false);
        limparImagem();
    }

    function iniciarEdicao(item) {
        setEditandoId(item.id);
        setProduto({ nome: item.nome, preco: String(item.preco) });
        setImagemAtual(item.imagem || null);
        setRemoverImagem(false);
        limparImagem();
        setErro('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateProduto(produto)) {
            return;
        }

        const dados = new FormData();
        dados.append('nome', produto.nome.trim());
        dados.append('preco', Number(produto.preco));
        if (arquivo) {
            dados.append('imagem', arquivo);
        } else if (editandoId && removerImagem) {
            dados.append('removerImagem', 'true');
        }
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

                    <div className="mb-3">
                        <label className="form-label" htmlFor="imagem">Imagem (.jpeg ou .png, até 2 MB)</label>
                        <input
                            id="imagem"
                            ref={inputArquivo}
                            className="form-control"
                            type="file"
                            name="imagem"
                            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                            onChange={handleArquivo}/>

                        {(preview || (imagemAtual && !removerImagem)) && (
                            <div className="mt-2 d-flex align-items-center gap-3">
                                <img
                                    src={preview || urlImagem(imagemAtual)}
                                    alt="Pré-visualização"
                                    className="img-thumbnail"
                                    style={{ width: 96, height: 96, objectFit: 'cover' }}/>
                                {preview ? (
                                    <button className="btn btn-sm btn-outline-secondary" type="button" onClick={limparImagem}>
                                        Descartar nova imagem
                                    </button>
                                ) : (
                                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setRemoverImagem(true)}>
                                        Remover imagem
                                    </button>
                                )}
                            </div>
                        )}
                        {removerImagem && !preview && (
                            <small className="text-muted d-block mt-1">A imagem será removida ao salvar.</small>
                        )}
                    </div>

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
                        <th>Imagem</th>
                        <th>Nome</th>
                        <th>Preço</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {carregando ? (
                        <tr>
                            <td colSpan={4} className="text-center">Carregando...</td>
                        </tr>
                    ) : listaProdutos.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center">Nenhum produto encontrado</td>
                        </tr>
                    ) : (
                        listaProdutos.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    {item.imagem ? (
                                        <img src={urlImagem(item.imagem)} alt={item.nome} width={48} height={48} style={{ objectFit: 'cover' }} className="rounded"/>
                                    ) : (
                                        <span className="text-muted">—</span>
                                    )}
                                </td>
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