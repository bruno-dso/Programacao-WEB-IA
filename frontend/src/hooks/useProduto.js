import api from "../utils/api";

async function getAll() {
    const response = await api.get('/produto/getAll');
    return response.data;
}

async function getById(id) {
    const response = await api.get(`/produto/getById/${id}`);
    return response.data;
}

async function create(produto) {
    const response = await api.post('/produto/create', produto);
    return response.data;
}

async function update(id, produto) {
    const response = await api.patch(`/produto/update/${id}`, produto);
    return response.data;
}

async function remove(id) {
    const response = await api.delete(`/produto/delete/${id}`);
    return response.data;
}

// Objeto fixo (mesma referência a cada render), seguro para usar em dependências de useEffect
const produtoService = { getAll, getById, create, update, remove };

function useProduto() {
    return produtoService;
}

// Extrai a mensagem de erro enviada pela API (ou uma mensagem padrão)
export function getErrorMessage(err, padrao = 'Erro ao comunicar com o servidor') {
    return err?.response?.data?.message || (err?.request ? 'Não foi possível conectar à API' : padrao);
}

export default useProduto;
