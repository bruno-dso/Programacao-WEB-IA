import api from "../utils/api";

async function criar() {
    const response = await api.post('/carrinho/create');
    return response.data.carrinho;
}

async function getById(id) {
    const response = await api.get(`/carrinho/getById/${id}`);
    return response.data;
}

async function adicionar(id, produtoId, quantidade = 1) {
    const response = await api.post(`/carrinho/${id}/adicionar`, { produtoId, quantidade });
    return response.data.carrinho;
}

async function atualizarQuantidade(id, produtoId, quantidade) {
    const response = await api.patch(`/carrinho/${id}/item/${produtoId}`, { quantidade });
    return response.data.carrinho;
}

async function removerItem(id, produtoId) {
    const response = await api.delete(`/carrinho/${id}/item/${produtoId}`);
    return response.data.carrinho;
}

async function limpar(id) {
    const response = await api.delete(`/carrinho/${id}/limpar`);
    return response.data.carrinho;
}

const carrinhoService = { criar, getById, adicionar, atualizarQuantidade, removerItem, limpar };

function useCarrinho() {
    return carrinhoService;
}

export default useCarrinho;