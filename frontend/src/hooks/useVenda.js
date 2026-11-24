import api from "../utils/api";

async function finalizar(dados) {
    const response = await api.post('/venda/finalizar', dados);
    return response.data.venda;
}

async function getAll() {
    const response = await api.get('/venda/getAll');
    return response.data;
}

async function getById(id) {
    const response = await api.get(`/venda/getById/${id}`);
    return response.data;
}

const vendaService = { finalizar, getAll, getById };

function useVenda() {
    return vendaService;
}

export default useVenda;